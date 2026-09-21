package com.evcharging.chargingservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "charging_sessions")
public class ChargingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long stationId;

    @Column(nullable = false)
    private Long portId;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Column(nullable = false)
    private Double energyConsumedKwh;

    @Column(nullable = false)
    private Double totalCost;

    @Column(nullable = false)
    private String status; // ACTIVE, COMPLETED, CANCELLED

    // No-arg constructor (required by JPA)
    public ChargingSession() {}

    // All-arg constructor
    public ChargingSession(Long id, Long userId, Long stationId, Long portId,
                            LocalDateTime startTime, LocalDateTime endTime,
                            Double energyConsumedKwh, Double totalCost, String status) {
        this.id = id;
        this.userId = userId;
        this.stationId = stationId;
        this.portId = portId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.energyConsumedKwh = energyConsumedKwh;
        this.totalCost = totalCost;
        this.status = status;
    }

    // Getters
    public Long getId()                       { return id; }
    public Long getUserId()                   { return userId; }
    public Long getStationId()                { return stationId; }
    public Long getPortId()                   { return portId; }
    public LocalDateTime getStartTime()       { return startTime; }
    public LocalDateTime getEndTime()         { return endTime; }
    public Double getEnergyConsumedKwh()      { return energyConsumedKwh; }
    public Double getTotalCost()              { return totalCost; }
    public String getStatus()                 { return status; }

    // Setters
    public void setId(Long id)                               { this.id = id; }
    public void setUserId(Long userId)                       { this.userId = userId; }
    public void setStationId(Long stationId)                 { this.stationId = stationId; }
    public void setPortId(Long portId)                       { this.portId = portId; }
    public void setStartTime(LocalDateTime startTime)        { this.startTime = startTime; }
    public void setEndTime(LocalDateTime endTime)            { this.endTime = endTime; }
    public void setEnergyConsumedKwh(Double v)               { this.energyConsumedKwh = v; }
    public void setTotalCost(Double totalCost)               { this.totalCost = totalCost; }
    public void setStatus(String status)                     { this.status = status; }
}
