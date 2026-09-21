package com.evcharging.apigateway;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Fallback controller for circuit breaker fallback URIs.
 *
 * When a downstream service is unavailable (circuit open), the gateway
 * routes to these endpoints instead of showing an error page.
 * Each endpoint returns a structured JSON 503 response.
 */
@RestController
public class FallbackController {

    @GetMapping("/fallback/user-service")
    public ResponseEntity<Map<String, Object>> userServiceFallback() {
        return serviceDown("user-service", "Authentication service is temporarily unavailable. Please try again shortly.");
    }

    @GetMapping("/fallback/station-service")
    public ResponseEntity<Map<String, Object>> stationServiceFallback() {
        return serviceDown("station-service", "Charging station data is temporarily unavailable.");
    }

    @GetMapping("/fallback/charging-service")
    public ResponseEntity<Map<String, Object>> chargingServiceFallback() {
        return serviceDown("charging-service", "Charging session service is temporarily unavailable.");
    }

    @GetMapping("/fallback/grid-service")
    public ResponseEntity<Map<String, Object>> gridServiceFallback() {
        return serviceDown("grid-service", "Grid monitoring service is temporarily unavailable.");
    }

    @GetMapping("/fallback/load-balancer-service")
    public ResponseEntity<Map<String, Object>> loadBalancerServiceFallback() {
        return serviceDown("load-balancer-service", "Smart allocation service is temporarily unavailable. Please try again later.");
    }

    @GetMapping("/fallback/notification-service")
    public ResponseEntity<Map<String, Object>> notificationServiceFallback() {
        return serviceDown("notification-service", "Notification service is temporarily unavailable.");
    }

    private ResponseEntity<Map<String, Object>> serviceDown(String service, String message) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "status", "SERVICE_UNAVAILABLE",
                "service", service,
                "message", message,
                "code", 503
        ));
    }
}
