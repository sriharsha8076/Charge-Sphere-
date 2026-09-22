package com.evcharging.apigateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.List;

/**
 * JWT Authentication Filter — GlobalFilter applied to every request through the gateway.
 *
 * Behaviour:
 *   - Public routes (whitelist) bypass validation entirely.
 *   - All other routes MUST carry a valid, non-expired Bearer JWT.
 *   - On valid token: extracts username + role claims and forwards them as
 *     X-User-Name and X-User-Role headers to downstream services.
 *   - On invalid/missing/expired token: responds 401 Unauthorized immediately
 *     without forwarding to any downstream service.
 *
 * Execution order: -1 (runs before rate limiter and circuit breaker filters).
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * Routes that do NOT require a JWT — public endpoints.
     */
    private static final List<String> PUBLIC_PATHS = List.of(
            "/users/login",
            "/users/register",
            "/users/refresh",
            "/actuator/health",
            "/actuator/info"
    );

    @Override
    public int getOrder() {
        return -1; // Run first, before all other filters
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Allow preflight CORS OPTIONS requests without authentication
        if (HttpMethod.OPTIONS.equals(request.getMethod())) {
            return chain.filter(exchange);
        }

        // Allow public paths without authentication
        for (String publicPath : PUBLIC_PATHS) {
            if (path.equals(publicPath) || path.startsWith(publicPath)) {
                return chain.filter(exchange);
            }
        }

        // Extract Bearer token from Authorization header
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("JWT filter: Missing or malformed Authorization header for path: {}", path);
            return respondWithError(exchange, HttpStatus.UNAUTHORIZED,
                    "{\"error\":\"Unauthorized\",\"message\":\"Missing or invalid Authorization header. Use: Bearer <token>\"}");
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = validateAndParseClaims(token);
            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            Object userIdObj = claims.get("userId");
            String userId = userIdObj != null ? userIdObj.toString() : "";

            log.debug("JWT filter: Authenticated user={}, role={}, path={}", username, role, path);

            // Forward user identity as headers to downstream services
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-User-Name", username != null ? username : "")
                    .header("X-User-Role", role != null ? role : "")
                    .header("X-User-Id", userId)
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (ExpiredJwtException e) {
            log.warn("JWT filter: Expired token for path: {}", path);
            return respondWithError(exchange, HttpStatus.UNAUTHORIZED,
                    "{\"error\":\"Unauthorized\",\"message\":\"JWT token has expired. Please login again.\"}");
        } catch (Exception e) {
            log.warn("JWT filter: Invalid token for path: {} — {}", path, e.getMessage());
            return respondWithError(exchange, HttpStatus.UNAUTHORIZED,
                    "{\"error\":\"Unauthorized\",\"message\":\"Invalid JWT token.\"}");
        }
    }

    private Claims validateAndParseClaims(String token) {
        Key signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Mono<Void> respondWithError(ServerWebExchange exchange, HttpStatus status, String body) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }
}
