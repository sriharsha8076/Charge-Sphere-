package com.evcharging.chargingservice.repository;

import com.evcharging.chargingservice.entity.ChargingSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChargingSessionRepository extends JpaRepository<ChargingSession, Long> {
    List<ChargingSession> findByUserId(Long userId);
    List<ChargingSession> findByUserIdAndStatus(Long userId, String status);
    List<ChargingSession> findByStationId(Long stationId);
    List<ChargingSession> findByStatus(String status);
    Optional<ChargingSession> findFirstByUserIdAndStatusOrderByStartTimeDesc(Long userId, String status);
}
