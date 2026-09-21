package com.evcharging.stationservice.controller;

import com.evcharging.stationservice.entity.ChargingPort;
import com.evcharging.stationservice.entity.ChargingStation;
import com.evcharging.stationservice.repository.ChargingPortRepository;
import com.evcharging.stationservice.repository.ChargingStationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/stations")
@CrossOrigin(origins = "*")
public class StationController {

    private final ChargingStationRepository stationRepository;
    private final ChargingPortRepository portRepository;

    public StationController(ChargingStationRepository stationRepository, ChargingPortRepository portRepository) {
        this.stationRepository = stationRepository;
        this.portRepository = portRepository;
    }

    @GetMapping
    public ResponseEntity<List<ChargingStation>> getAllStations() {
        return ResponseEntity.ok(stationRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStationById(@PathVariable Long id) {
        Optional<ChargingStation> stationOpt = stationRepository.findById(id);
        if (stationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Station not found");
        }
        return ResponseEntity.ok(stationOpt.get());
    }

    @PostMapping
    public ResponseEntity<ChargingStation> createStation(@RequestBody ChargingStation station) {
        if (station.getStatus() == null) station.setStatus("AVAILABLE");
        if (station.getAvailablePorts() == null) station.setAvailablePorts(station.getTotalPorts());
        
        ChargingStation saved = stationRepository.save(station);
        
        // Auto create ports if empty
        if (saved.getPorts() == null || saved.getPorts().isEmpty()) {
            for (int i = 1; i <= saved.getTotalPorts(); i++) {
                ChargingPort port = new ChargingPort(null, saved, i, "CCS2", 60.0, "AVAILABLE");
                portRepository.save(port);
            }
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(stationRepository.findById(saved.getId()).orElse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStation(@PathVariable Long id, @RequestBody ChargingStation updated) {
        Optional<ChargingStation> stationOpt = stationRepository.findById(id);
        if (stationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Station not found");
        }
        ChargingStation station = stationOpt.get();
        if (updated.getName() != null) station.setName(updated.getName());
        if (updated.getLocation() != null) station.setLocation(updated.getLocation());
        if (updated.getPricePerKwh() != null) station.setPricePerKwh(updated.getPricePerKwh());
        if (updated.getStatus() != null) station.setStatus(updated.getStatus());
        if (updated.getGridZoneId() != null) station.setGridZoneId(updated.getGridZoneId());
        return ResponseEntity.ok(stationRepository.save(station));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStation(@PathVariable Long id) {
        if (stationRepository.existsById(id)) {
            stationRepository.deleteById(id);
            return ResponseEntity.ok("Station deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Station not found");
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<?> getStationAvailability(@PathVariable Long id) {
        Optional<ChargingStation> stationOpt = stationRepository.findById(id);
        if (stationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Station not found");
        }
        ChargingStation station = stationOpt.get();
        Map<String, Object> map = new HashMap<>();
        map.put("stationId", station.getId());
        map.put("stationName", station.getName());
        map.put("totalPorts", station.getTotalPorts());
        map.put("availablePorts", station.getAvailablePorts());
        map.put("status", station.getStatus());
        map.put("ports", station.getPorts());
        return ResponseEntity.ok(map);
    }

    @PostMapping("/{id}/ports/{portId}/occupy")
    public ResponseEntity<?> occupyPort(@PathVariable Long id, @PathVariable Long portId) {
        ChargingStation station = stationRepository.findById(id).orElse(null);
        ChargingPort port = portRepository.findById(portId).orElse(null);

        if (station == null || port == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Station or Port not found");
        }

        if ("OCCUPIED".equalsIgnoreCase(port.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Port is already occupied");
        }

        port.setStatus("OCCUPIED");
        portRepository.save(port);

        int newAvail = Math.max(0, station.getAvailablePorts() - 1);
        station.setAvailablePorts(newAvail);
        if (newAvail == 0) {
            station.setStatus("FULL");
        }
        stationRepository.save(station);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Port occupied successfully");
        res.put("stationId", station.getId());
        res.put("portId", port.getId());
        res.put("availablePorts", station.getAvailablePorts());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/ports/{portId}/release")
    public ResponseEntity<?> releasePort(@PathVariable Long id, @PathVariable Long portId) {
        ChargingStation station = stationRepository.findById(id).orElse(null);
        ChargingPort port = portRepository.findById(portId).orElse(null);

        if (station == null || port == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Station or Port not found");
        }

        port.setStatus("AVAILABLE");
        portRepository.save(port);

        int newAvail = Math.min(station.getTotalPorts(), station.getAvailablePorts() + 1);
        station.setAvailablePorts(newAvail);
        if (newAvail > 0 && "FULL".equalsIgnoreCase(station.getStatus())) {
            station.setStatus("AVAILABLE");
        }
        stationRepository.save(station);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Port released successfully");
        res.put("stationId", station.getId());
        res.put("portId", port.getId());
        res.put("availablePorts", station.getAvailablePorts());
        return ResponseEntity.ok(res);
    }
}
