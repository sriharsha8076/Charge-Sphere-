package com.evcharging.loadbalancerservice.dto;

public class StationCandidateDto {
    private Long id;
    private String name;
    private String location;
    private Long gridZoneId;
    private String gridZoneName;
    private Double pricePerKwh;
    private Integer totalPorts;
    private Integer availablePorts;
    private String status;
    private Double gridCurrentLoadKw;
    private Double gridMaxCapacityKw;
    private Double gridLoadPercentage;
    private String gridStatus; // NORMAL, HIGH_LOAD, OVERLOADED
    private Double loadScore;  // currentLoad / maxCapacity
    private Double estimatedCost;
    private Boolean isRecommended;
    private Boolean isOverloadedZone;
    private Long selectedPortId;
    private Integer selectedPortNumber;

    public StationCandidateDto() {}

    // Getters
    public Long getId()                   { return id; }
    public String getName()               { return name; }
    public String getLocation()           { return location; }
    public Long getGridZoneId()           { return gridZoneId; }
    public String getGridZoneName()       { return gridZoneName; }
    public Double getPricePerKwh()        { return pricePerKwh; }
    public Integer getTotalPorts()        { return totalPorts; }
    public Integer getAvailablePorts()    { return availablePorts; }
    public String getStatus()             { return status; }
    public Double getGridCurrentLoadKw()  { return gridCurrentLoadKw; }
    public Double getGridMaxCapacityKw()  { return gridMaxCapacityKw; }
    public Double getGridLoadPercentage() { return gridLoadPercentage; }
    public String getGridStatus()         { return gridStatus; }
    public Double getLoadScore()          { return loadScore; }
    public Double getEstimatedCost()      { return estimatedCost; }
    public Boolean getIsRecommended()     { return isRecommended; }
    public Boolean getIsOverloadedZone()  { return isOverloadedZone; }
    public Long getSelectedPortId()       { return selectedPortId; }
    public Integer getSelectedPortNumber(){ return selectedPortNumber; }

    // Setters
    public void setId(Long id)                          { this.id = id; }
    public void setName(String name)                    { this.name = name; }
    public void setLocation(String location)            { this.location = location; }
    public void setGridZoneId(Long gridZoneId)          { this.gridZoneId = gridZoneId; }
    public void setGridZoneName(String gridZoneName)    { this.gridZoneName = gridZoneName; }
    public void setPricePerKwh(Double pricePerKwh)      { this.pricePerKwh = pricePerKwh; }
    public void setTotalPorts(Integer totalPorts)       { this.totalPorts = totalPorts; }
    public void setAvailablePorts(Integer availablePorts) { this.availablePorts = availablePorts; }
    public void setStatus(String status)                { this.status = status; }
    public void setGridCurrentLoadKw(Double v)          { this.gridCurrentLoadKw = v; }
    public void setGridMaxCapacityKw(Double v)          { this.gridMaxCapacityKw = v; }
    public void setGridLoadPercentage(Double v)         { this.gridLoadPercentage = v; }
    public void setGridStatus(String gridStatus)        { this.gridStatus = gridStatus; }
    public void setLoadScore(Double loadScore)          { this.loadScore = loadScore; }
    public void setEstimatedCost(Double estimatedCost)  { this.estimatedCost = estimatedCost; }
    public void setIsRecommended(Boolean isRecommended) { this.isRecommended = isRecommended; }
    public void setIsOverloadedZone(Boolean v)          { this.isOverloadedZone = v; }
    public void setSelectedPortId(Long selectedPortId)  { this.selectedPortId = selectedPortId; }
    public void setSelectedPortNumber(Integer v)        { this.selectedPortNumber = v; }
}
