package com.evcharging.gridservice;

import com.evcharging.gridservice.controller.GridController;
import com.evcharging.gridservice.entity.GridZone;
import com.evcharging.gridservice.repository.GridZoneRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Slice test for GridController.
 * Uses @WebMvcTest so only the web layer is loaded — no database, no Eureka.
 */
@WebMvcTest(controllers = GridController.class)
class GridControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GridZoneRepository zoneRepository;

    // Shared test fixture
    private GridZone zone1;
    private GridZone zone2;

    @BeforeEach
    void setUp() {
        zone1 = new GridZone(1L, "Vijayawada Central",   150.0, 500.0, "NORMAL");
        zone2 = new GridZone(2L, "Mangalagiri Zone",     350.0, 500.0, "HIGH_LOAD");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /grid/zones
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /grid/zones – returns all zones with HTTP 200")
    void getAllGridZones_returnsAllZones() throws Exception {
        when(zoneRepository.findAll()).thenReturn(List.of(zone1, zone2));

        mockMvc.perform(get("/grid/zones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].zoneName").value("Vijayawada Central"))
                .andExpect(jsonPath("$[1].zoneName").value("Mangalagiri Zone"));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /grid/zones/{id}
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /grid/zones/{id} – found zone returns 200 with correct data")
    void getGridZoneById_found() throws Exception {
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(zone1));

        mockMvc.perform(get("/grid/zones/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.zoneName").value("Vijayawada Central"))
                .andExpect(jsonPath("$.currentLoadKw").value(150.0))
                .andExpect(jsonPath("$.maxCapacityKw").value(500.0));
    }

    @Test
    @DisplayName("GET /grid/zones/{id} – unknown id returns 404")
    void getGridZoneById_notFound() throws Exception {
        when(zoneRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/grid/zones/99"))
                .andExpect(status().isNotFound());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /grid/zones/{id}/load
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /grid/zones/{id}/load – returns load percentage and status")
    void getZoneLoadInfo_returnsCorrectPercentage() throws Exception {
        // 150/500 = 30%
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(zone1));

        mockMvc.perform(get("/grid/zones/1/load"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.zoneId").value(1))
                .andExpect(jsonPath("$.currentLoadKw").value(150.0))
                .andExpect(jsonPath("$.maxCapacityKw").value(500.0))
                .andExpect(jsonPath("$.loadPercentage").value(30.0))
                .andExpect(jsonPath("$.status").value("NORMAL"))
                .andExpect(jsonPath("$.isOverloaded").value(false));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /grid/zones/{id}/add-load
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /grid/zones/{id}/add-load – adds kW and recalculates status")
    void addZoneLoad_addsLoadAndUpdatesStatus() throws Exception {
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(zone1));
        when(zoneRepository.save(any(GridZone.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Double> payload = Map.of("kw", 50.0);

        mockMvc.perform(post("/grid/zones/1/add-load")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                // 150 + 50 = 200 kW
                .andExpect(jsonPath("$.currentLoadKw").value(200.0))
                // 200/500 = 40% → still NORMAL
                .andExpect(jsonPath("$.status").value("NORMAL"));
    }

    @Test
    @DisplayName("POST /grid/zones/{id}/add-load – triggers OVERLOADED when ≥90%")
    void addZoneLoad_triggersOverloadedStatus() throws Exception {
        // Start at 420 kW (84%), add 60 → 480 (96%) → OVERLOADED
        GridZone nearLimit = new GridZone(1L, "Zone 1", 420.0, 500.0, "HIGH_LOAD");
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(nearLimit));
        when(zoneRepository.save(any(GridZone.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Double> payload = Map.of("kw", 60.0);

        mockMvc.perform(post("/grid/zones/1/add-load")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentLoadKw").value(480.0))
                .andExpect(jsonPath("$.status").value("OVERLOADED"));
    }

    @Test
    @DisplayName("POST /grid/zones/{id}/add-load – returns 404 for unknown zone")
    void addZoneLoad_unknownZoneReturns404() throws Exception {
        when(zoneRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(post("/grid/zones/99/add-load")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kw\": 50.0}"))
                .andExpect(status().isNotFound());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /grid/zones/{id}/remove-load
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /grid/zones/{id}/remove-load – removes kW and updates status")
    void removeZoneLoad_removesLoadCorrectly() throws Exception {
        when(zoneRepository.findById(2L)).thenReturn(Optional.of(zone2));
        when(zoneRepository.save(any(GridZone.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Double> payload = Map.of("kw", 200.0);

        mockMvc.perform(post("/grid/zones/2/remove-load")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                // 350 - 200 = 150 kW
                .andExpect(jsonPath("$.currentLoadKw").value(150.0))
                .andExpect(jsonPath("$.status").value("NORMAL"));
    }

    @Test
    @DisplayName("POST /grid/zones/{id}/remove-load – load never goes below 0")
    void removeZoneLoad_doesNotGoBelowZero() throws Exception {
        // Only 50 kW currently, try to remove 200 → should floor at 0
        GridZone lowLoad = new GridZone(1L, "Zone 1", 50.0, 500.0, "NORMAL");
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(lowLoad));
        when(zoneRepository.save(any(GridZone.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Double> payload = Map.of("kw", 200.0);

        mockMvc.perform(post("/grid/zones/1/remove-load")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentLoadKw").value(0.0));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT /grid/zones/{id}/load (full set)
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /grid/zones/{id}/load – sets load to exact value")
    void updateZoneLoad_setsExactValue() throws Exception {
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(zone1));
        when(zoneRepository.save(any(GridZone.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Double> payload = Map.of("currentLoadKw", 400.0);

        mockMvc.perform(put("/grid/zones/1/load")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentLoadKw").value(400.0))
                // 400/500 = 80% → HIGH_LOAD
                .andExpect(jsonPath("$.status").value("HIGH_LOAD"));
    }

    @Test
    @DisplayName("PUT /grid/zones/{id}/load – missing currentLoadKw returns 400")
    void updateZoneLoad_missingBodyReturns400() throws Exception {
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(zone1));

        // Payload does NOT contain the required 'currentLoadKw' key
        Map<String, Double> payload = Map.of("wrongField", 100.0);

        mockMvc.perform(put("/grid/zones/1/load")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /grid/status
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /grid/status – aggregates load across all zones")
    void getOverallGridStatus_aggregatesCorrectly() throws Exception {
        // Zone 1: 150 kW / 500 kW, Zone 2: 350 kW / 500 kW → total 500/1000 = 50%
        when(zoneRepository.findAll()).thenReturn(List.of(zone1, zone2));

        mockMvc.perform(get("/grid/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalZones").value(2))
                .andExpect(jsonPath("$.totalCurrentLoadKw").value(500.0))
                .andExpect(jsonPath("$.totalCapacityKw").value(1000.0))
                .andExpect(jsonPath("$.averageGridLoadPercentage").value(50.0))
                .andExpect(jsonPath("$.overloadedZonesCount").value(0))
                .andExpect(jsonPath("$.systemStatus").value("STABLE"));
    }

    @Test
    @DisplayName("GET /grid/status – systemStatus is WARNING_OVERLOAD when any zone is overloaded")
    void getOverallGridStatus_warningWhenOverloaded() throws Exception {
        GridZone overloaded = new GridZone(3L, "Zone 3", 480.0, 500.0, "OVERLOADED");
        when(zoneRepository.findAll()).thenReturn(List.of(zone1, overloaded));

        mockMvc.perform(get("/grid/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overloadedZonesCount").value(1))
                .andExpect(jsonPath("$.systemStatus").value("WARNING_OVERLOAD"));
    }
}
