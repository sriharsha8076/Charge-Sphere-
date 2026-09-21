package com.evcharging.gridservice.controller;

import com.evcharging.gridservice.entity.GridZone;
import com.evcharging.gridservice.repository.GridZoneRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/grid")
@CrossOrigin(origins = "*")
public class GridController {

    private final GridZoneRepository zoneRepository;

    public GridController(GridZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getOverallGridStatus() {
        List<GridZone> zones = zoneRepository.findAll();
        double totalCurrentLoad = zones.stream().mapToDouble(GridZone::getCurrentLoadKw).sum();
        double totalCapacity = zones.stream().mapToDouble(GridZone::getMaxCapacityKw).sum();
        long overloadedCount = zones.stream().filter(z -> "OVERLOADED".equalsIgnoreCase(z.getStatus())).count();
        double avgLoadPct = totalCapacity > 0 ? (totalCurrentLoad / totalCapacity) * 100.0 : 0.0;

        Map<String, Object> status = new HashMap<>();
        status.put("totalZones", zones.size());
        status.put("totalCurrentLoadKw", totalCurrentLoad);
        status.put("totalCapacityKw", totalCapacity);
        status.put("averageGridLoadPercentage", Math.round(avgLoadPct * 10.0) / 10.0);
        status.put("overloadedZonesCount", overloadedCount);
        status.put("systemStatus", overloadedCount > 0 ? "WARNING_OVERLOAD" : "STABLE");

        return ResponseEntity.ok(status);
    }

    @GetMapping("/zones")
    public ResponseEntity<List<GridZone>> getAllGridZones() {
        return ResponseEntity.ok(zoneRepository.findAll());
    }

    @GetMapping("/zones/{id}")
    public ResponseEntity<?> getGridZoneById(@PathVariable Long id) {
        Optional<GridZone> zone = zoneRepository.findById(id);
        if (zone.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Grid zone not found");
        }
        return ResponseEntity.ok(zone.get());
    }

    @GetMapping("/zones/{id}/load")
    public ResponseEntity<?> getZoneLoadInfo(@PathVariable Long id) {
        Optional<GridZone> zoneOpt = zoneRepository.findById(id);
        if (zoneOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Grid zone not found");
        }
        GridZone zone = zoneOpt.get();
        Map<String, Object> map = new HashMap<>();
        map.put("zoneId", zone.getId());
        map.put("zoneName", zone.getZoneName());
        map.put("currentLoadKw", zone.getCurrentLoadKw());
        map.put("maxCapacityKw", zone.getMaxCapacityKw());
        map.put("loadPercentage", Math.round(zone.getLoadPercentage() * 10.0) / 10.0);
        map.put("status", zone.getStatus());
        map.put("isOverloaded", zone.getLoadPercentage() >= 90.0);
        return ResponseEntity.ok(map);
    }

    @PutMapping("/zones/{id}/load")
    public ResponseEntity<?> updateZoneLoad(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        Double newLoadKw = payload.get("currentLoadKw");
        if (newLoadKw == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing 'currentLoadKw' parameter");
        }

        Optional<GridZone> zoneOpt = zoneRepository.findById(id);
        if (zoneOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Grid zone not found");
        }
        GridZone zone = zoneOpt.get();
        zone.setCurrentLoadKw(Math.max(0.0, newLoadKw));
        zone.updateStatusBasedOnLoad();
        GridZone updated = zoneRepository.save(zone);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/zones/{id}/add-load")
    public ResponseEntity<?> addZoneLoad(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        Double kwToAdd = payload.getOrDefault("kw", 50.0);

        Optional<GridZone> zoneOpt = zoneRepository.findById(id);
        if (zoneOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Grid zone not found");
        }
        GridZone zone = zoneOpt.get();
        zone.setCurrentLoadKw(zone.getCurrentLoadKw() + kwToAdd);
        zone.updateStatusBasedOnLoad();
        GridZone updated = zoneRepository.save(zone);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/zones/{id}/remove-load")
    public ResponseEntity<?> removeZoneLoad(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        Double kwToRemove = payload.getOrDefault("kw", 50.0);

        Optional<GridZone> zoneOpt = zoneRepository.findById(id);
        if (zoneOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Grid zone not found");
        }
        GridZone zone = zoneOpt.get();
        zone.setCurrentLoadKw(Math.max(0.0, zone.getCurrentLoadKw() - kwToRemove));
        zone.updateStatusBasedOnLoad();
        GridZone updated = zoneRepository.save(zone);
        return ResponseEntity.ok(updated);
    }
}
