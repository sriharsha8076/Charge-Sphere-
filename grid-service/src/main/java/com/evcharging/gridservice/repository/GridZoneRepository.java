package com.evcharging.gridservice.repository;

import com.evcharging.gridservice.entity.GridZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GridZoneRepository extends JpaRepository<GridZone, Long> {
    List<GridZone> findByStatus(String status);
}
