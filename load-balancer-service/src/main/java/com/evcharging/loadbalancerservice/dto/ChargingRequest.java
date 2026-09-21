package com.evcharging.loadbalancerservice.dto;

public class ChargingRequest {
    private Long userId;
    private String vehicleModel;
    private Double requiredEnergyKwh;
    private String preferredTime;
    private Long preferredStationId; // optional override

    public ChargingRequest() {}

    public ChargingRequest(Long userId, String vehicleModel, Double requiredEnergyKwh,
                           String preferredTime, Long preferredStationId) {
        this.userId = userId;
        this.vehicleModel = vehicleModel;
        this.requiredEnergyKwh = requiredEnergyKwh;
        this.preferredTime = preferredTime;
        this.preferredStationId = preferredStationId;
    }

    public Long getUserId()              { return userId; }
    public String getVehicleModel()      { return vehicleModel; }
    public Double getRequiredEnergyKwh() { return requiredEnergyKwh; }
    public String getPreferredTime()     { return preferredTime; }
    public Long getPreferredStationId()  { return preferredStationId; }

    public void setUserId(Long userId)                    { this.userId = userId; }
    public void setVehicleModel(String vehicleModel)      { this.vehicleModel = vehicleModel; }
    public void setRequiredEnergyKwh(Double v)            { this.requiredEnergyKwh = v; }
    public void setPreferredTime(String preferredTime)    { this.preferredTime = preferredTime; }
    public void setPreferredStationId(Long v)             { this.preferredStationId = v; }
}
