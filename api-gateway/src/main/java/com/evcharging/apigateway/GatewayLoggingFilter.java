package com.evcharging.apigateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Gateway Request/Response Logging Filter.
 *
 * Logs every request that passes through the API Gateway with:
 *   - HTTP Method
 *   - Request path
 *   - Response HTTP status code
 *   - Total request duration in milliseconds
 *
 * Execution order: 1 (runs after JWT filter so username header is available).
 */
@Component
public class GatewayLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(GatewayLoggingFilter.class);

    @Override
    public int getOrder() {
        return 1;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getPath();
        String user = exchange.getRequest().getHeaders().getFirst("X-User-Name");
        String userLabel = (user != null && !user.isBlank()) ? user : "anonymous";

        log.info("→ GATEWAY | {} {} | user={}", method, path, userLabel);

        return chain.filter(exchange).doFinally(signalType -> {
            long duration = System.currentTimeMillis() - startTime;
            int status = exchange.getResponse().getStatusCode() != null
                    ? exchange.getResponse().getStatusCode().value()
                    : 0;
            log.info("← GATEWAY | {} {} | status={} | {}ms | user={}",
                    method, path, status, duration, userLabel);
        });
    }
}
