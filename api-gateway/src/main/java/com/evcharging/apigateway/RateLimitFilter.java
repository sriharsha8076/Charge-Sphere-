package com.evcharging.apigateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory Rate Limiting GlobalFilter.
 *
 * Limits each principal (authenticated user or IP) to MAX_REQUESTS_PER_SECOND
 * requests per second. Counters reset every second.
 *
 * NFR-PERF01: API Gateway MUST enforce rate limiting to prevent abuse.
 *
 * Note: This is an in-memory implementation suitable for a single-instance deployment.
 * For production multi-instance deployments, replace with Redis-backed rate limiting.
 *
 * Execution order: 0 (after JWT filter at -1, before logging filter at 1).
 */
@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final int MAX_REQUESTS_PER_SECOND = 20; // generous limit for demo

    // Maps principal → request count in current second
    private final Map<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> windowStart = new ConcurrentHashMap<>();

    @Override
    public int getOrder() {
        return 0;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String principal = resolvePrincipal(exchange);
        long now = System.currentTimeMillis() / 1000; // current second bucket

        // Reset counter if we've entered a new second window
        Long lastWindow = windowStart.get(principal);
        if (lastWindow == null || lastWindow < now) {
            windowStart.put(principal, now);
            requestCounts.put(principal, new AtomicInteger(0));
        }

        int count = requestCounts.get(principal).incrementAndGet();
        if (count > MAX_REQUESTS_PER_SECOND) {
            log.warn("Rate limit exceeded for principal: {} ({} req/s)", principal, count);
            return respondTooManyRequests(exchange, principal);
        }

        return chain.filter(exchange);
    }

    private String resolvePrincipal(ServerWebExchange exchange) {
        // Use username header set by JwtAuthenticationFilter if available
        String user = exchange.getRequest().getHeaders().getFirst("X-User-Name");
        if (user != null && !user.isBlank()) return user;
        // Fall back to client IP
        if (exchange.getRequest().getRemoteAddress() != null) {
            return exchange.getRequest().getRemoteAddress().getHostString();
        }
        return "unknown";
    }

    private Mono<Void> respondTooManyRequests(ServerWebExchange exchange, String principal) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Maximum " +
                MAX_REQUESTS_PER_SECOND + " requests/second allowed.\"}";
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }
}
