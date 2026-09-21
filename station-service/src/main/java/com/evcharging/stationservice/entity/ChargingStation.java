package com.evcharging.stationservice.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "charging_stations")
public class ChargingStation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private Long gridZoneId;

    @Column(nullable = false)
    private Double pricePerKwh;

    @Column(nullable = false)
    private Integer totalPorts;

    @Column(nullable = false)
    private Integer availablePorts;

    @Column(nullable = false)
    private String status; // AVAILABLE, FULL, MAINTENANCE

    private Double latitude;
    private Double longitude;

    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ChargingPort> ports = new ArrayList<>();

    // No-arg constructor (required by JPA)
    public ChargingStation() {}

    // All-arg constructor (without ports)
    public ChargingStation(Long id, String name, String location, Long gridZoneId,
                           Double pricePerKwh, Integer totalPorts, Integer availablePorts,
                           String status, Double latitude, Double longitude) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.gridZoneId = gridZoneId;
        this.pricePerKwh = pricePerKwh;
        this.totalPorts = totalPorts;
        this.availablePorts = availablePorts;
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // All-arg constructor (with ports)
    public ChargingStation(Long id, String name, String location, Long gridZoneId,
                           Double pricePerKwh, Integer totalPorts, Integer availablePorts,
                           String status, Double latitude, Double longitude, List<ChargingPort> ports) {
        this(id, name, location, gridZoneId, pricePerKwh, totalPorts, availablePorts, status, latitude, longitude);
        if (ports != null) {
            this.ports = ports;
        }
    }

    // Getters
    public Long getId()               { return id; }
    public String getName()           { return name; }
    public String getLocation()       { return location; }
    public Long getGridZoneId()       { return gridZoneId; }
    public Double getPricePerKwh()    { return pricePerKwh; }
    public Integer getTotalPorts()    { return totalPorts; }
    public Integer getAvailablePorts(){ return availablePorts; }
    public String getStatus()         { return status; }
    public Double getLatitude()       { return latitude; }
    public Double getLongitude()      { return longitude; }
    public List<ChargingPort> getPorts() { return ports; }

    // Setters
    public void setId(Long id)                        { this.id = id; }
    public void setName(String name)                  { this.name = name; }
    public void setLocation(String location)          { this.location = location; }
    public void setGridZoneId(Long gridZoneId)        { this.gridZoneId = gridZoneId; }
    public void setPricePerKwh(Double p)              { this.pricePerKwh = p; }
    public void setTotalPorts(Integer t)              { this.totalPorts = t; }
    public void setAvailablePorts(Integer a)          { this.availablePorts = a; }
    public void setStatus(String status)              { this.status = status; }
    public void setLatitude(Double latitude)          { this.latitude = latitude; }
    public void setLongitude(Double longitude)        { this.longitude = longitude; }
    public void setPorts(List<ChargingPort> ports)    { this.ports = ports; }
}
