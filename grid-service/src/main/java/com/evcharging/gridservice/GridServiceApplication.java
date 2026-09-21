package com.evcharging.gridservice;

import com.evcharging.gridservice.entity.GridZone;
import com.evcharging.gridservice.repository.GridZoneRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class GridServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(GridServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initGridZones(GridZoneRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                repo.save(new GridZone(1L, "Zone 1 - Vijayawada Central", 210.0, 500.0, "NORMAL"));
                repo.save(new GridZone(2L, "Zone 2 - Benz Circle Hub", 320.0, 500.0, "HIGH_LOAD"));
                repo.save(new GridZone(3L, "Zone 3 - Gollapudi West", 180.0, 500.0, "NORMAL"));
                repo.save(new GridZone(4L, "Zone 4 - Auto Nagar Industrial", 260.0, 500.0, "NORMAL"));
                repo.save(new GridZone(5L, "Zone 5 - Mangalagiri South", 175.0, 500.0, "NORMAL"));

                System.out.println("5 Grid Zones initialized in Grid Service.");
            }
        };
    }
}
