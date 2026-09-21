package com.evcharging.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import reactor.core.publisher.Mono;

@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    /**
     * Rate limiter key resolver — resolves the rate limit key from the
     * X-User-Name header (set by JwtAuthenticationFilter) for authenticated requests,
     * or falls back to the client IP address for anonymous requests.
     *
     * This is referenced as #{@principalNameKeyResolver} in application.yml.
     */
    @Bean
    public KeyResolver principalNameKeyResolver() {
        return exchange -> {
            String user = exchange.getRequest().getHeaders().getFirst("X-User-Name");
            if (user != null && !user.isBlank()) {
                return Mono.just(user);
            }
            // Fall back to remote IP for unauthenticated requests
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getHostString()
                    : "unknown";
            return Mono.just(ip);
        };
    }
}
