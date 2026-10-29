package com.evcharging.loadbalancerservice;

import com.evcharging.loadbalancerservice.dto.AllocationResponse;
import com.evcharging.loadbalancerservice.dto.ChargingRequest;
import com.evcharging.loadbalancerservice.service.LoadBalancerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LoadBalancerService.
 *
 * Strategy: inject a mock @LoadBalanced RestTemplate and return hand-crafted
 * Map payloads that mirror what the real Station / Grid services return over HTTP.
 */
@ExtendWith(MockitoExtension.class)
class LoadBalancerServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private LoadBalancerService loadBalancerService;

    // ── Field values injected via @Value in production ─────────────────────────
    private static final String STATION_URL   = "lb://station-service/stations";
    private static final String GRID_URL      = "lb://grid-service/grid";
    private static final String CHARGING_URL  = "lb://charging-service/sessions";
    private static final String NOTIF_URL     = "lb://notification-service/notifications";

    @BeforeEach
    void injectConfigValues() {
        ReflectionTestUtils.setField(loadBalancerService, "stationServiceUrl",      STATION_URL);
        ReflectionTestUtils.setField(loadBalancerService, "gridServiceUrl",         GRID_URL);
        ReflectionTestUtils.setField(loadBalancerService, "chargingServiceUrl",     CHARGING_URL);
        ReflectionTestUtils.setField(loadBalancerService, "notificationServiceUrl", NOTIF_URL);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helper builders
    // ──────────────────────────────────────────────────────────────────────────

    /** Build a minimal station Map the way Spring deserialises the JSON. */
    private Map<String, Object> stationMap(long id, long gridZoneId,
                                           int totalPorts, int availablePorts,
                                           double price, String status) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",             id);
        m.put("name",           "Station-" + id);
        m.put("location",       "Vijayawada");
        m.put("gridZoneId",     gridZoneId);
        m.put("pricePerKwh",    price);
        m.put("totalPorts",     totalPorts);
        m.put("availablePorts", availablePorts);
        m.put("status",         status);
        // one available port
        Map<String, Object> port = new HashMap<>();
        port.put("id",         10L + id);
        port.put("portNumber", 1);
        port.put("status",     availablePorts > 0 ? "AVAILABLE" : "OCCUPIED");
        m.put("ports", List.of(port));
        return m;
    }

    /** Build a grid-zone Map with explicit load values. */
    private Map<String, Object> gridZoneMap(long id, double currentLoad, double maxCapacity) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",             id);
        m.put("zoneName",       "Zone-" + id);
        m.put("currentLoadKw",  currentLoad);
        m.put("maxCapacityKw",  maxCapacity);
        double pct = (currentLoad / maxCapacity) * 100.0;
        m.put("status",         pct >= 90.0 ? "OVERLOADED" : (pct >= 70.0 ? "HIGH_LOAD" : "NORMAL"));
        return m;
    }

    private ChargingRequest requestFor(double energy) {
        ChargingRequest req = new ChargingRequest();
        req.setUserId(1L);
        req.setRequiredEnergyKwh(energy);
        return req;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 1 – Normal happy path: picks the station with the lowest load score
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("selectOptimalStation – picks the station in the lowest-loaded grid zone")
    void selectOptimalStation_picksLowestLoadStation() {
        // Station 1 → Zone 1 (30% load) – should be selected
        // Station 2 → Zone 2 (70% load) – should be alternative
        Map<String, Object> zone1 = gridZoneMap(1L, 150.0, 500.0); // 30%
        Map<String, Object> zone2 = gridZoneMap(2L, 350.0, 500.0); // 70%

        Map<String, Object> station1 = stationMap(1L, 1L, 4, 2, 12.0, "AVAILABLE");
        Map<String, Object> station2 = stationMap(2L, 2L, 4, 3, 10.0, "AVAILABLE");

        when(restTemplate.getForObject(eq(STATION_URL), eq(Map[].class)))
                .thenReturn(new Map[]{station1, station2});
        when(restTemplate.getForObject(eq(GRID_URL + "/zones"), eq(Map[].class)))
                .thenReturn(new Map[]{zone1, zone2});

        AllocationResponse response = loadBalancerService.selectOptimalStation(requestFor(25.0));

        assertEquals("SUCCESS", response.getStatus());
        assertNotNull(response.getRecommendedStation());
        // Station 1 has loadScore = 150/500 = 0.3 → should win over Station 2's 0.7
        assertEquals(1L, response.getRecommendedStation().getId());
        assertTrue(response.getRecommendedStation().getIsRecommended());
        // Alternative list must NOT contain the recommended station
        response.getAlternativeStations().forEach(s ->
                assertNotEquals(1L, s.getId().longValue()));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 2 – Overload bypass: stations in ≥90% zones are excluded from eligibles
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("selectOptimalStation – bypasses all stations in overloaded zones (≥90%)")
    void selectOptimalStation_bypassesOverloadedZone() {
        // Zone 1 is overloaded (95%), Zone 2 is safe (40%)
        Map<String, Object> zone1 = gridZoneMap(1L, 475.0, 500.0); // 95% OVERLOADED
        Map<String, Object> zone2 = gridZoneMap(2L, 200.0, 500.0); // 40% NORMAL

        Map<String, Object> station1 = stationMap(1L, 1L, 4, 2, 12.0, "AVAILABLE"); // in overloaded zone
        Map<String, Object> station2 = stationMap(2L, 2L, 4, 3, 10.0, "AVAILABLE"); // safe zone

        when(restTemplate.getForObject(eq(STATION_URL), eq(Map[].class)))
                .thenReturn(new Map[]{station1, station2});
        when(restTemplate.getForObject(eq(GRID_URL + "/zones"), eq(Map[].class)))
                .thenReturn(new Map[]{zone1, zone2});

        AllocationResponse response = loadBalancerService.selectOptimalStation(requestFor(25.0));

        assertEquals("SUCCESS", response.getStatus());
        // Station 2 (safe zone) must be selected; Station 1 (overloaded) must be skipped
        assertEquals(2L, response.getRecommendedStation().getId());
        assertTrue(response.getRecommendedStation().getIsRecommended());
        // Station 1 should appear only in alternatives
        boolean station1InAlternatives = response.getAlternativeStations()
                .stream().anyMatch(s -> s.getId() == 1L);
        assertTrue(station1InAlternatives, "Overloaded station should appear in alternatives list");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 3 – All zones overloaded: emergency fallback (WARNING_OVERLOAD)
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("selectOptimalStation – WARNING_OVERLOAD when all zones are ≥90% but ports exist")
    void selectOptimalStation_warningOverloadWhenAllZonesOverloaded() {
        Map<String, Object> zone1 = gridZoneMap(1L, 480.0, 500.0); // 96%
        Map<String, Object> zone2 = gridZoneMap(2L, 460.0, 500.0); // 92%

        Map<String, Object> station1 = stationMap(1L, 1L, 4, 2, 12.0, "AVAILABLE");
        Map<String, Object> station2 = stationMap(2L, 2L, 4, 1, 10.0, "AVAILABLE");

        when(restTemplate.getForObject(eq(STATION_URL), eq(Map[].class)))
                .thenReturn(new Map[]{station1, station2});
        when(restTemplate.getForObject(eq(GRID_URL + "/zones"), eq(Map[].class)))
                .thenReturn(new Map[]{zone1, zone2});

        AllocationResponse response = loadBalancerService.selectOptimalStation(requestFor(25.0));

        assertEquals("WARNING_OVERLOAD", response.getStatus());
        assertNotNull(response.getRecommendedStation());
        assertTrue(response.getMessage().contains("Emergency allocation"));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 4 – All ports occupied: NO_STATION_AVAILABLE
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("selectOptimalStation – NO_STATION_AVAILABLE when every station has 0 ports free")
    void selectOptimalStation_noStationAvailableWhenAllPortsOccupied() {
        Map<String, Object> zone1 = gridZoneMap(1L, 480.0, 500.0); // overloaded

        Map<String, Object> station1 = stationMap(1L, 1L, 4, 0, 12.0, "FULL"); // no ports
        Map<String, Object> station2 = stationMap(2L, 1L, 4, 0, 10.0, "FULL"); // no ports

        when(restTemplate.getForObject(eq(STATION_URL), eq(Map[].class)))
                .thenReturn(new Map[]{station1, station2});
        when(restTemplate.getForObject(eq(GRID_URL + "/zones"), eq(Map[].class)))
                .thenReturn(new Map[]{zone1});

        AllocationResponse response = loadBalancerService.selectOptimalStation(requestFor(25.0));

        assertEquals("NO_STATION_AVAILABLE", response.getStatus());
        assertNull(response.getRecommendedStation());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 5 – Station service is down: returns empty list (graceful degradation)
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("selectOptimalStation – handles station service RestClientException gracefully")
    void selectOptimalStation_gracefulDegradationWhenStationServiceDown() {
        when(restTemplate.getForObject(eq(STATION_URL), eq(Map[].class)))
                .thenThrow(new RestClientException("Connection refused"));
        when(restTemplate.getForObject(eq(GRID_URL + "/zones"), eq(Map[].class)))
                .thenReturn(new Map[]{});

        AllocationResponse response = loadBalancerService.selectOptimalStation(requestFor(25.0));

        // With no stations, must return NO_STATION_AVAILABLE, not throw
        assertEquals("NO_STATION_AVAILABLE", response.getStatus());
        assertNull(response.getRecommendedStation());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 6 – Null request uses default energy of 25 kWh
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("selectOptimalStation – null request defaults to 25 kWh energy")
    void selectOptimalStation_nullRequestDefaultsTo25kWh() {
        Map<String, Object> zone1  = gridZoneMap(1L, 100.0, 500.0);
        Map<String, Object> station1 = stationMap(1L, 1L, 4, 2, 12.0, "AVAILABLE");

        when(restTemplate.getForObject(eq(STATION_URL), eq(Map[].class)))
                .thenReturn(new Map[]{station1});
        when(restTemplate.getForObject(eq(GRID_URL + "/zones"), eq(Map[].class)))
                .thenReturn(new Map[]{zone1});

        AllocationResponse response = loadBalancerService.selectOptimalStation(null);

        assertEquals("SUCCESS", response.getStatus());
        assertEquals(25.0, response.getRequiredEnergyKwh());
        // estimatedCost = price * energy = 12.0 * 25.0 = 300.0
        assertEquals(300.0, response.getEstimatedCost());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 7 – Load score calculation accuracy
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("selectOptimalStation – load score is computed as currentLoad/maxCapacity")
    void selectOptimalStation_loadScoreCalculationIsCorrect() {
        // Zone with 250 kW / 500 kW = score 0.5
        Map<String, Object> zone1    = gridZoneMap(1L, 250.0, 500.0);
        Map<String, Object> station1 = stationMap(1L, 1L, 4, 2, 10.0, "AVAILABLE");

        when(restTemplate.getForObject(eq(STATION_URL), eq(Map[].class)))
                .thenReturn(new Map[]{station1});
        when(restTemplate.getForObject(eq(GRID_URL + "/zones"), eq(Map[].class)))
                .thenReturn(new Map[]{zone1});

        AllocationResponse response = loadBalancerService.selectOptimalStation(requestFor(20.0));

        assertEquals("SUCCESS", response.getStatus());
        // score = round(0.5 * 1000) / 1000 = 0.5
        assertEquals(0.5, response.getRecommendedStation().getLoadScore());
        // percentage = round(50.0 * 10) / 10 = 50.0
        assertEquals(50.0, response.getRecommendedStation().getGridLoadPercentage());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test 8 – confirmAndAllocate orchestrates all 4 downstream calls
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("confirmAndAllocate – orchestrates station, grid, session, and notification calls")
    void confirmAndAllocate_orchestratesAllDownstreamServices() {
        // Station details mock
        Map<String, Object> stationDetails = new HashMap<>();
        stationDetails.put("gridZoneId",  1L);
        stationDetails.put("pricePerKwh", 12.0);
        stationDetails.put("name",        "Vijayawada Central");
        when(restTemplate.getForObject(eq(STATION_URL + "/1"), eq(Map.class)))
                .thenReturn(stationDetails);

        // Occupy port
        when(restTemplate.postForObject(contains("/occupy"), isNull(), eq(String.class)))
                .thenReturn("OK");

        // Add grid load
        when(restTemplate.postForObject(contains("/add-load"), any(), eq(String.class)))
                .thenReturn("OK");

        // Start session returns a session with id
        Map<String, Object> sessionResp = new HashMap<>();
        sessionResp.put("id", 42L);
        when(restTemplate.postForObject(contains("/start"), any(), eq(Map.class)))
                .thenReturn(sessionResp);

        // Notification
        when(restTemplate.postForObject(contains("/send"), any(), eq(String.class)))
                .thenReturn("OK");

        AllocationResponse response = loadBalancerService.confirmAndAllocate(1L, 1L, 11L, 25.0);

        assertEquals("SUCCESS", response.getStatus());
        assertEquals(42L, response.getSessionId());
        assertEquals(300.0, response.getEstimatedCost()); // 12.0 * 25.0

        // Verify all 4 downstream services were called
        verify(restTemplate, times(1)).postForObject(contains("/occupy"),   isNull(),  eq(String.class));
        verify(restTemplate, times(1)).postForObject(contains("/add-load"), any(),     eq(String.class));
        verify(restTemplate, times(1)).postForObject(contains("/start"),    any(),     eq(Map.class));
        verify(restTemplate, times(1)).postForObject(contains("/send"),     any(),     eq(String.class));
    }
}
