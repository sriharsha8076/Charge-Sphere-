package com.evcharging.chargingservice;

import com.evcharging.chargingservice.entity.ChargingSession;
import com.evcharging.chargingservice.repository.ChargingSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * @SpringBootTest integration test for the Charging Session lifecycle.
 *
 * Uses an H2 in-memory database (activated via profile "test").
 * Profile "test" sets:
 *   spring.datasource.url=jdbc:h2:mem:testdb
 *   spring.jpa.hibernate.ddl-auto=create-drop
 *   eureka.client.enabled=false
 *
 * Tests the flow: Start Session → query active session → Stop Session.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ChargingSessionIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ChargingSessionRepository sessionRepository;

    private String baseUrl;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port + "/sessions";
        sessionRepository.deleteAll(); // clean state before each test
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helper: build a start-session payload
    // ──────────────────────────────────────────────────────────────────────────
    private Map<String, Object> startPayload(long userId, long stationId, long portId,
                                             double energy, double price) {
        Map<String, Object> p = new HashMap<>();
        p.put("userId",             userId);
        p.put("stationId",          stationId);
        p.put("portId",             portId);
        p.put("energyConsumedKwh",  energy);
        p.put("pricePerKwh",        price);
        return p;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 1 – Start session returns 201 CREATED with correct fields
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /sessions/start – creates a session and returns 201")
    void startSession_returns201WithCorrectFields() {
        Map<String, Object> payload = startPayload(1L, 1L, 1L, 25.0, 12.0);

        ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/start", payload, Map.class);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("ACTIVE", response.getBody().get("status"));
        assertEquals(1,   ((Number) response.getBody().get("userId")).intValue());
        assertEquals(1,   ((Number) response.getBody().get("stationId")).intValue());
        // totalCost = 25.0 * 12.0 = 300.0
        assertEquals(300.0, ((Number) response.getBody().get("totalCost")).doubleValue(), 0.01);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 2 – Duplicate active session is rejected with 400
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /sessions/start – duplicate active session returns 400")
    void startSession_duplicateActiveSessionReturns400() {
        Map<String, Object> payload = startPayload(2L, 1L, 2L, 30.0, 12.0);
        restTemplate.postForEntity(baseUrl + "/start", payload, Map.class); // first start

        // Second start for same user while session is still ACTIVE
        ResponseEntity<Object> second = restTemplate.postForEntity(baseUrl + "/start", payload, Object.class);
        assertEquals(HttpStatus.BAD_REQUEST, second.getStatusCode());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 3 – GET /sessions/user/{userId}/active returns active session
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /sessions/user/{userId}/active – returns the active session")
    void getActiveSession_returnsActiveSessionForUser() {
        Map<String, Object> payload = startPayload(3L, 2L, 3L, 20.0, 10.0);
        restTemplate.postForEntity(baseUrl + "/start", payload, Map.class);

        ResponseEntity<Map> active = restTemplate.getForEntity(
                baseUrl + "/user/3/active", Map.class);

        assertEquals(HttpStatus.OK, active.getStatusCode());
        assertNotNull(active.getBody());
        assertEquals("ACTIVE", active.getBody().get("status"));
        assertEquals(3, ((Number) active.getBody().get("userId")).intValue());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 4 – Stop session transitions status to COMPLETED
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /sessions/stop – transitions active session to COMPLETED")
    void stopSession_transitionsToCompleted() {
        // 1. Start
        Map<String, Object> startPayload = startPayload(4L, 1L, 4L, 25.0, 12.0);
        ResponseEntity<Map> startResp = restTemplate.postForEntity(
                baseUrl + "/start", startPayload, Map.class);
        assertEquals(HttpStatus.CREATED, startResp.getStatusCode());
        Long sessionId = ((Number) startResp.getBody().get("id")).longValue();

        // 2. Stop by sessionId
        Map<String, Object> stopPayload = new HashMap<>();
        stopPayload.put("sessionId", sessionId);
        ResponseEntity<Map> stopResp = restTemplate.postForEntity(
                baseUrl + "/stop", stopPayload, Map.class);

        assertEquals(HttpStatus.OK, stopResp.getStatusCode());
        assertEquals("COMPLETED", stopResp.getBody().get("status"));
        assertNotNull(stopResp.getBody().get("endTime"),
                "endTime must be set when session is stopped");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 5 – Stop by userId when no sessionId is given
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /sessions/stop – stops session by userId without sessionId")
    void stopSession_byUserId() {
        Map<String, Object> startPayload = startPayload(5L, 2L, 5L, 40.0, 11.0);
        restTemplate.postForEntity(baseUrl + "/start", startPayload, Map.class);

        Map<String, Object> stopPayload = new HashMap<>();
        stopPayload.put("userId", 5L);
        ResponseEntity<Map> stopResp = restTemplate.postForEntity(
                baseUrl + "/stop", stopPayload, Map.class);

        assertEquals(HttpStatus.OK, stopResp.getStatusCode());
        assertEquals("COMPLETED", stopResp.getBody().get("status"));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 6 – Stop non-existent session returns 404
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /sessions/stop – non-existent sessionId returns 404")
    void stopSession_nonExistentSessionReturns404() {
        Map<String, Object> stopPayload = new HashMap<>();
        stopPayload.put("sessionId", 9999L);
        ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/stop", stopPayload, String.class);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 7 – GET /sessions/stats returns correct aggregates
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /sessions/stats – returns correct aggregate statistics")
    void getStats_returnsCorrectAggregates() {
        // Start two sessions
        restTemplate.postForEntity(baseUrl + "/start", startPayload(6L, 1L, 6L, 25.0, 12.0), Map.class);
        restTemplate.postForEntity(baseUrl + "/start", startPayload(7L, 2L, 7L, 20.0, 10.0), Map.class);

        ResponseEntity<Map> statsResp = restTemplate.getForEntity(baseUrl + "/stats", Map.class);

        assertEquals(HttpStatus.OK, statsResp.getStatusCode());
        Map<?, ?> stats = statsResp.getBody();
        assertNotNull(stats);
        assertEquals(2, ((Number) stats.get("totalSessions")).intValue());
        assertEquals(2, ((Number) stats.get("activeSessions")).intValue());
        // totalEnergy = 25.0 + 20.0 = 45.0
        assertEquals(45.0, ((Number) stats.get("totalEnergyConsumedKwh")).doubleValue(), 0.01);
        // totalRevenue = 25*12 + 20*10 = 300 + 200 = 500.0
        assertEquals(500.0, ((Number) stats.get("totalRevenue")).doubleValue(), 0.01);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 8 – GET /sessions/user/{userId} returns session history
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /sessions/user/{userId} – returns all sessions for a user")
    void getUserSessions_returnsSessionHistory() {
        restTemplate.postForEntity(baseUrl + "/start", startPayload(8L, 1L, 8L, 30.0, 12.0), Map.class);

        ResponseEntity<List> historyResp = restTemplate.getForEntity(
                baseUrl + "/user/8", List.class);

        assertEquals(HttpStatus.OK, historyResp.getStatusCode());
        assertNotNull(historyResp.getBody());
        assertFalse(historyResp.getBody().isEmpty());
    }
}
