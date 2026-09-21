package com.evcharging.loadbalancerservice.dto;

import java.util.List;

public class AllocationResponse {
    private String status; // SUCCESS, WARNING_OVERLOAD, NO_STATION_AVAILABLE
    private String message;
    private StationCandidateDto recommendedStation;
    private List<StationCandidateDto> alternativeStations;
    private Double requiredEnergyKwh;
    private Double estimatedCost;
    private Long sessionId;

    public AllocationResponse() {}

    public AllocationResponse(String status, String message, StationCandidateDto recommendedStation,
                              List<StationCandidateDto> alternativeStations, Double requiredEnergyKwh,
                              Double estimatedCost, Long sessionId) {
        this.status = status;
        this.message = message;
        this.recommendedStation = recommendedStation;
        this.alternativeStations = alternativeStations;
        this.requiredEnergyKwh = requiredEnergyKwh;
        this.estimatedCost = estimatedCost;
        this.sessionId = sessionId;
    }

    public String getStatus()                              { return status; }
    public String getMessage()                             { return message; }
    public StationCandidateDto getRecommendedStation()     { return recommendedStation; }
    public List<StationCandidateDto> getAlternativeStations() { return alternativeStations; }
    public Double getRequiredEnergyKwh()                   { return requiredEnergyKwh; }
    public Double getEstimatedCost()                       { return estimatedCost; }
    public Long getSessionId()                             { return sessionId; }

    public void setStatus(String status)                                      { this.status = status; }
    public void setMessage(String message)                                    { this.message = message; }
    public void setRecommendedStation(StationCandidateDto recommendedStation) { this.recommendedStation = recommendedStation; }
    public void setAlternativeStations(List<StationCandidateDto> list)        { this.alternativeStations = list; }
    public void setRequiredEnergyKwh(Double requiredEnergyKwh)                { this.requiredEnergyKwh = requiredEnergyKwh; }
    public void setEstimatedCost(Double estimatedCost)                        { this.estimatedCost = estimatedCost; }
    public void setSessionId(Long sessionId)                                  { this.sessionId = sessionId; }
}
