package com.evcharging.loadbalancerservice.controller;

import com.evcharging.loadbalancerservice.dto.AllocationResponse;
import com.evcharging.loadbalancerservice.dto.ChargingRequest;
import com.evcharging.loadbalancerservice.service.LoadBalancerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/load-balancer")
@CrossOrigin(origins = "*")
public class LoadBalancerController {

    private final LoadBalancerService loadBalancerService;

    public LoadBalancerController(LoadBalancerService loadBalancerService) {
        this.loadBalancerService = loadBalancerService;
    }

    @PostMapping("/select-station")
    public ResponseEntity<AllocationResponse> selectStation(@RequestBody ChargingRequest request) {
        return ResponseEntity.ok(loadBalancerService.selectOptimalStation(request));
    }

    @PostMapping("/allocate")
    public ResponseEntity<AllocationResponse> allocateStation(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.getOrDefault("userId", 1L).toString());
        Long stationId = Long.valueOf(payload.get("stationId").toString());
        Long portId = Long.valueOf(payload.get("portId").toString());
        Double energyKwh = payload.containsKey("requiredEnergyKwh") ? Double.valueOf(payload.get("requiredEnergyKwh").toString()) : 25.0;

        return ResponseEntity.ok(loadBalancerService.confirmAndAllocate(userId, stationId, portId, energyKwh));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<AllocationResponse> getRecommendations(@RequestParam(defaultValue = "1") Long userId,
                                                                 @RequestParam(defaultValue = "25.0") Double energyKwh) {
        ChargingRequest req = new ChargingRequest();
        req.setUserId(userId);
        req.setRequiredEnergyKwh(energyKwh);
        return ResponseEntity.ok(loadBalancerService.selectOptimalStation(req));
    }
}
