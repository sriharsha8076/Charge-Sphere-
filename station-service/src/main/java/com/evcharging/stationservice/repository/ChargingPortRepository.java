package com.evcharging.stationservice.repository;

import com.evcharging.stationservice.entity.ChargingPort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChargingPortRepository extends JpaRepository<ChargingPort, Long> {
    List<ChargingPort> findByStationId(Long stationId);
    List<ChargingPort> findByStationIdAndStatus(Long stationId, String status);
}
