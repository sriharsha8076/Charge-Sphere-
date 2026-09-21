package com.evcharging.loadbalancerservice.service;

import com.evcharging.loadbalancerservice.dto.AllocationResponse;
import com.evcharging.loadbalancerservice.dto.ChargingRequest;
import com.evcharging.loadbalancerservice.dto.StationCandidateDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LoadBalancerService {

    // URLs are lb://service-name/path — resolved via Spring Cloud LoadBalancer + Eureka
    @Value("${services.station-service-url}")
    private String stationServiceUrl;

    @Value("${services.grid-service-url}")
    private String gridServiceUrl;

    @Value("${services.charging-service-url}")
    private String chargingServiceUrl;

    @Value("${services.notification-service-url}")
    private String notificationServiceUrl;

    @Autowired
    private RestTemplate restTemplate; // @LoadBalanced bean from LoadBalancerServiceApplication

    public AllocationResponse selectOptimalStation(ChargingRequest request) {
        double requiredEnergy = request.getRequiredEnergyKwh() != null ? request.getRequiredEnergyKwh() : 25.0;

        // 1. Get all stations from Station Service (via Eureka lb://station-service/stations)
        List<Map<String, Object>> stationsRaw = fetchList(stationServiceUrl);

        // 2. Get all grid zones from Grid Service (via Eureka lb://grid-service/grid)
        List<Map<String, Object>> gridZonesRaw = fetchList(gridServiceUrl + "/zones");
        Map<Long, Map<String, Object>> gridMap = new HashMap<>();
        for (Map<String, Object> gz : gridZonesRaw) {
            Long gzId = Long.valueOf(gz.get("id").toString());
            gridMap.put(gzId, gz);
        }

        List<StationCandidateDto> candidates = new ArrayList<>();

        for (Map<String, Object> st : stationsRaw) {
            Long stationId = Long.valueOf(st.get("id").toString());
            String name = (String) st.get("name");
            String location = (String) st.get("location");
            Long gridZoneId = Long.valueOf(st.get("gridZoneId").toString());
            Double price = Double.valueOf(st.get("pricePerKwh").toString());
            Integer totalPorts = Integer.valueOf(st.get("totalPorts").toString());
            Integer availablePorts = Integer.valueOf(st.get("availablePorts").toString());
            String status = (String) st.get("status");

            Map<String, Object> gz = gridMap.getOrDefault(gridZoneId, new HashMap<>());
            String gzName = (String) gz.getOrDefault("zoneName", "Zone " + gridZoneId);
            Double currentLoad = gz.containsKey("currentLoadKw") ? Double.valueOf(gz.get("currentLoadKw").toString()) : 200.0;
            Double maxCap = gz.containsKey("maxCapacityKw") ? Double.valueOf(gz.get("maxCapacityKw").toString()) : 500.0;
            String gzStatus = (String) gz.getOrDefault("status", "NORMAL");

            double gridLoadPct = maxCap > 0 ? (currentLoad / maxCap) * 100.0 : 0.0;
            double score = maxCap > 0 ? (currentLoad / maxCap) : 1.0; // score = currentGridLoad / maximumGridLoad
            boolean isOverloaded = gridLoadPct >= 90.0 || "OVERLOADED".equalsIgnoreCase(gzStatus);

            StationCandidateDto candidate = new StationCandidateDto();
            candidate.setId(stationId);
            candidate.setName(name);
            candidate.setLocation(location);
            candidate.setGridZoneId(gridZoneId);
            candidate.setGridZoneName(gzName);
            candidate.setPricePerKwh(price);
            candidate.setTotalPorts(totalPorts);
            candidate.setAvailablePorts(availablePorts);
            candidate.setStatus(status);
            candidate.setGridCurrentLoadKw(currentLoad);
            candidate.setGridMaxCapacityKw(maxCap);
            candidate.setGridLoadPercentage(Math.round(gridLoadPct * 10.0) / 10.0);
            candidate.setGridStatus(gzStatus);
            candidate.setLoadScore(Math.round(score * 1000.0) / 1000.0);
            candidate.setEstimatedCost(Math.round(price * requiredEnergy * 100.0) / 100.0);
            candidate.setIsOverloadedZone(isOverloaded);
            candidate.setIsRecommended(false);

            // Find an available port
            List<Map<String, Object>> portsRaw = (List<Map<String, Object>>) st.get("ports");
            if (portsRaw != null) {
                for (Map<String, Object> p : portsRaw) {
                    if ("AVAILABLE".equalsIgnoreCase((String) p.get("status"))) {
                        candidate.setSelectedPortId(Long.valueOf(p.get("id").toString()));
                        candidate.setSelectedPortNumber(Integer.valueOf(p.get("portNumber").toString()));
                        break;
                    }
                }
            }

            candidates.add(candidate);
        }

        // 3. Filter candidates: Must have available ports (>0) and NOT be in an overloaded grid zone (<90%)
        List<StationCandidateDto> eligible = candidates.stream()
                .filter(c -> c.getAvailablePorts() > 0 && !c.getIsOverloadedZone())
                .sorted(Comparator.comparing(StationCandidateDto::getLoadScore))
                .collect(Collectors.toList());

        AllocationResponse response = new AllocationResponse();
        response.setRequiredEnergyKwh(requiredEnergy);

        if (eligible.isEmpty()) {
            // Check if any station with port available exists even if overloaded
            Optional<StationCandidateDto> fallback = candidates.stream()
                    .filter(c -> c.getAvailablePorts() > 0)
                    .min(Comparator.comparing(StationCandidateDto::getLoadScore));

            if (fallback.isPresent()) {
                StationCandidateDto rec = fallback.get();
                rec.setIsRecommended(true);
                response.setStatus("WARNING_OVERLOAD");
                response.setMessage("Grid overload detected in primary zones. Emergency allocation to " + rec.getName() + ".");
                response.setRecommendedStation(rec);
                response.setAlternativeStations(candidates.stream().filter(c -> !c.getId().equals(rec.getId())).collect(Collectors.toList()));
                response.setEstimatedCost(rec.getEstimatedCost());
            } else {
                response.setStatus("NO_STATION_AVAILABLE");
                response.setMessage("All EV stations are currently full or experiencing severe grid load.");
                response.setAlternativeStations(candidates);
            }
            return response;
        }

        // Selected station is the eligible candidate with the lowest grid load score
        StationCandidateDto selected = eligible.get(0);
        selected.setIsRecommended(true);

        List<StationCandidateDto> alternatives = candidates.stream()
                .filter(c -> !c.getId().equals(selected.getId()))
                .collect(Collectors.toList());

        response.setStatus("SUCCESS");
        response.setMessage("Smart Allocation Successful: Selected station with lowest grid load (" + selected.getGridLoadPercentage() + "%).");
        response.setRecommendedStation(selected);
        response.setAlternativeStations(alternatives);
        response.setEstimatedCost(selected.getEstimatedCost());

        return response;
    }

    public AllocationResponse confirmAndAllocate(Long userId, Long stationId, Long portId, Double energyKwh) {
        double targetEnergy = energyKwh != null ? energyKwh : 25.0;

        // 1. Fetch station details to get price & gridZoneId
        Map<String, Object> station = fetchMap(stationServiceUrl + "/" + stationId);
        Long gridZoneId = Long.valueOf(station.get("gridZoneId").toString());
        Double pricePerKwh = Double.valueOf(station.get("pricePerKwh").toString());
        String stationName = (String) station.get("name");

        // 2. Reserve / Occupy Port on Station Service
        try {
            restTemplate.postForObject(stationServiceUrl + "/" + stationId + "/ports/" + portId + "/occupy", null, String.class);
        } catch (Exception e) {
            System.err.println("Warning: Port occupy call failed: " + e.getMessage());
        }

        // 3. Update Grid Load on Grid Service (Add ~50 kW load for active fast charger)
        try {
            Map<String, Object> loadReq = new HashMap<>();
            loadReq.put("kw", 50.0);
            restTemplate.postForObject(gridServiceUrl + "/zones/" + gridZoneId + "/add-load", loadReq, String.class);
        } catch (Exception e) {
            System.err.println("Warning: Grid load update failed: " + e.getMessage());
        }

        // 4. Start Charging Session on Charging Session Service
        Long sessionId = null;
        try {
            Map<String, Object> sessionReq = new HashMap<>();
            sessionReq.put("userId", userId);
            sessionReq.put("stationId", stationId);
            sessionReq.put("portId", portId);
            sessionReq.put("energyConsumedKwh", targetEnergy);
            sessionReq.put("pricePerKwh", pricePerKwh);

            Map<String, Object> sessionRes = restTemplate.postForObject(chargingServiceUrl + "/start", sessionReq, Map.class);
            if (sessionRes != null && sessionRes.containsKey("id")) {
                sessionId = Long.valueOf(sessionRes.get("id").toString());
            }
        } catch (Exception e) {
            System.err.println("Warning: Start session call failed: " + e.getMessage());
        }

        // 5. Send Notification via Notification Service
        try {
            Map<String, Object> notifReq = new HashMap<>();
            notifReq.put("userId", userId);
            notifReq.put("title", "Smart Charging Allocated");
            notifReq.put("message", "Allocated at " + stationName + " (Port #" + portId + "). Target energy: " + targetEnergy + " kWh.");
            notifReq.put("type", "SESSION_START");
            restTemplate.postForObject(notificationServiceUrl + "/send", notifReq, String.class);
        } catch (Exception e) {
            System.err.println("Warning: Notification dispatch failed: " + e.getMessage());
        }

        AllocationResponse response = new AllocationResponse();
        response.setStatus("SUCCESS");
        response.setMessage("Charging session successfully allocated and initiated at " + stationName);
        response.setRequiredEnergyKwh(targetEnergy);
        response.setEstimatedCost(Math.round(pricePerKwh * targetEnergy * 100.0) / 100.0);
        response.setSessionId(sessionId);

        return response;
    }

    private List<Map<String, Object>> fetchList(String url) {
        try {
            Map[] res = restTemplate.getForObject(url, Map[].class);
            return res != null ? Arrays.asList(res) : Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private Map<String, Object> fetchMap(String url) {
        try {
            Map res = restTemplate.getForObject(url, Map.class);
            return res != null ? res : Collections.emptyMap();
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
