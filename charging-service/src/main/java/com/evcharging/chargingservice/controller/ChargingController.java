package com.evcharging.chargingservice.controller;

import com.evcharging.chargingservice.entity.ChargingSession;
import com.evcharging.chargingservice.repository.ChargingSessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sessions")
@CrossOrigin(origins = "*")
public class ChargingController {

    private final ChargingSessionRepository sessionRepository;

    public ChargingController(ChargingSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @PostMapping("/start")
    public ResponseEntity<?> startSession(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        Long stationId = Long.valueOf(payload.get("stationId").toString());
        Long portId = Long.valueOf(payload.get("portId").toString());
        Double targetEnergy = payload.containsKey("energyConsumedKwh") ? Double.valueOf(payload.get("energyConsumedKwh").toString()) : 25.0;
        Double pricePerKwh = payload.containsKey("pricePerKwh") ? Double.valueOf(payload.get("pricePerKwh").toString()) : 12.0;

        // Check if user already has an active session
        List<ChargingSession> active = sessionRepository.findByUserIdAndStatus(userId, "ACTIVE");
        if (!active.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(active.get(0));
        }

        ChargingSession session = new ChargingSession();
        session.setUserId(userId);
        session.setStationId(stationId);
        session.setPortId(portId);
        session.setStartTime(LocalDateTime.now());
        session.setEnergyConsumedKwh(targetEnergy);
        session.setTotalCost(Math.round(targetEnergy * pricePerKwh * 100.0) / 100.0);
        session.setStatus("ACTIVE");

        ChargingSession saved = sessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/stop")
    public ResponseEntity<?> stopSession(@RequestBody Map<String, Object> payload) {
        Long sessionId = payload.containsKey("sessionId") ? Long.valueOf(payload.get("sessionId").toString()) : null;
        Long userId = payload.containsKey("userId") ? Long.valueOf(payload.get("userId").toString()) : null;

        ChargingSession session = null;
        if (sessionId != null) {
            session = sessionRepository.findById(sessionId).orElse(null);
        } else if (userId != null) {
            session = sessionRepository.findFirstByUserIdAndStatusOrderByStartTimeDesc(userId, "ACTIVE").orElse(null);
        }

        if (session == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Active charging session not found");
        }

        session.setEndTime(LocalDateTime.now());
        session.setStatus("COMPLETED");

        ChargingSession updated = sessionRepository.save(session);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSessionById(@PathVariable Long id) {
        java.util.Optional<ChargingSession> sessionOpt = sessionRepository.findById(id);
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Session not found");
        }
        return ResponseEntity.ok(sessionOpt.get());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ChargingSession>> getUserSessions(@PathVariable Long userId) {
        return ResponseEntity.ok(sessionRepository.findByUserId(userId));
    }

    @GetMapping("/user/{userId}/active")
    public ResponseEntity<?> getActiveUserSession(@PathVariable Long userId) {
        List<ChargingSession> active = sessionRepository.findByUserIdAndStatus(userId, "ACTIVE");
        if (active.isEmpty()) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(active.get(0));
    }

    @GetMapping
    public ResponseEntity<List<ChargingSession>> getAllSessions() {
        return ResponseEntity.ok(sessionRepository.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ChargingSession>> getAllActiveSessions() {
        return ResponseEntity.ok(sessionRepository.findByStatus("ACTIVE"));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getChargingStats() {
        List<ChargingSession> all = sessionRepository.findAll();
        double totalEnergy = all.stream().mapToDouble(ChargingSession::getEnergyConsumedKwh).sum();
        double totalCost = all.stream().mapToDouble(ChargingSession::getTotalCost).sum();
        long activeCount = all.stream().filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSessions", all.size());
        stats.put("activeSessions", activeCount);
        stats.put("totalEnergyConsumedKwh", Math.round(totalEnergy * 10.0) / 10.0);
        stats.put("totalRevenue", Math.round(totalCost * 100.0) / 100.0);

        return ResponseEntity.ok(stats);
    }
}
