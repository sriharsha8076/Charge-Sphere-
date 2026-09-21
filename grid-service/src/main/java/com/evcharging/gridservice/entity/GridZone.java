package com.evcharging.gridservice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "grid_zones")
public class GridZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String zoneName;

    @Column(nullable = false)
    private Double currentLoadKw;

    @Column(nullable = false)
    private Double maxCapacityKw;

    @Column(nullable = false)
    private String status; // NORMAL (<70%), HIGH_LOAD (70-90%), OVERLOADED (>90%)

    // No-arg constructor (required by JPA)
    public GridZone() {}

    // All-arg constructor
    public GridZone(Long id, String zoneName, Double currentLoadKw, Double maxCapacityKw, String status) {
        this.id = id;
        this.zoneName = zoneName;
        this.currentLoadKw = currentLoadKw;
        this.maxCapacityKw = maxCapacityKw;
        this.status = status;
    }

    // Getters
    public Long getId()             { return id; }
    public String getZoneName()     { return zoneName; }
    public Double getCurrentLoadKw(){ return currentLoadKw; }
    public Double getMaxCapacityKw(){ return maxCapacityKw; }
    public String getStatus()       { return status; }

    // Setters
    public void setId(Long id)                    { this.id = id; }
    public void setZoneName(String zoneName)      { this.zoneName = zoneName; }
    public void setCurrentLoadKw(Double v)        { this.currentLoadKw = v; }
    public void setMaxCapacityKw(Double v)        { this.maxCapacityKw = v; }
    public void setStatus(String status)          { this.status = status; }

    // Computed field (not stored in DB)
    public Double getLoadPercentage() {
        if (maxCapacityKw == null || maxCapacityKw == 0) return 0.0;
        return (currentLoadKw / maxCapacityKw) * 100.0;
    }

    public void updateStatusBasedOnLoad() {
        double pct = getLoadPercentage();
        if (pct >= 90.0) {
            this.status = "OVERLOADED";
        } else if (pct >= 70.0) {
            this.status = "HIGH_LOAD";
        } else {
            this.status = "NORMAL";
        }
    }
}
