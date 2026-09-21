package com.evcharging.stationservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "charging_ports")
public class ChargingPort {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "station_id", nullable = false)
    @JsonIgnore
    private ChargingStation station;

    @Column(nullable = false)
    private Integer portNumber;

    @Column(nullable = false)
    private String portType; // CCS2, Type 2 AC, CHAdeMO

    @Column(nullable = false)
    private Double kwCapacity; // 22.0, 50.0, 60.0, 120.0

    @Column(nullable = false)
    private String status; // AVAILABLE, OCCUPIED, MAINTENANCE

    // No-arg constructor (required by JPA)
    public ChargingPort() {}

    // All-arg constructor
    public ChargingPort(Long id, ChargingStation station, Integer portNumber,
                        String portType, Double kwCapacity, String status) {
        this.id = id;
        this.station = station;
        this.portNumber = portNumber;
        this.portType = portType;
        this.kwCapacity = kwCapacity;
        this.status = status;
    }

    // Getters
    public Long getId()                 { return id; }
    public ChargingStation getStation() { return station; }
    public Integer getPortNumber()      { return portNumber; }
    public String getPortType()         { return portType; }
    public Double getKwCapacity()       { return kwCapacity; }
    public String getStatus()           { return status; }

    // Setters
    public void setId(Long id)                        { this.id = id; }
    public void setStation(ChargingStation station)   { this.station = station; }
    public void setPortNumber(Integer portNumber)     { this.portNumber = portNumber; }
    public void setPortType(String portType)          { this.portType = portType; }
    public void setKwCapacity(Double kwCapacity)      { this.kwCapacity = kwCapacity; }
    public void setStatus(String status)              { this.status = status; }
}
