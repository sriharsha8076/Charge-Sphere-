package com.evcharging.userservice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private Double batteryCapacityKwh;

    @Column(nullable = false, unique = true)
    private String registrationNumber;

    // No-arg constructor (required by JPA)
    public Vehicle() {}

    // All-arg constructor
    public Vehicle(Long id, Long userId, String model, Double batteryCapacityKwh, String registrationNumber) {
        this.id = id;
        this.userId = userId;
        this.model = model;
        this.batteryCapacityKwh = batteryCapacityKwh;
        this.registrationNumber = registrationNumber;
    }

    // Getters
    public Long getId()                   { return id; }
    public Long getUserId()               { return userId; }
    public String getModel()              { return model; }
    public Double getBatteryCapacityKwh() { return batteryCapacityKwh; }
    public String getRegistrationNumber() { return registrationNumber; }

    // Setters
    public void setId(Long id)                          { this.id = id; }
    public void setUserId(Long userId)                  { this.userId = userId; }
    public void setModel(String model)                  { this.model = model; }
    public void setBatteryCapacityKwh(Double b)         { this.batteryCapacityKwh = b; }
    public void setRegistrationNumber(String r)         { this.registrationNumber = r; }
}
