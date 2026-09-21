package com.evcharging.stationservice;

import com.evcharging.stationservice.entity.ChargingPort;
import com.evcharging.stationservice.entity.ChargingStation;
import com.evcharging.stationservice.repository.ChargingPortRepository;
import com.evcharging.stationservice.repository.ChargingStationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;

import java.util.ArrayList;

@SpringBootApplication
@EnableDiscoveryClient
public class StationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(StationServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initStations(ChargingStationRepository stationRepo, ChargingPortRepository portRepo) {
        return args -> {
            if (stationRepo.count() == 0) {
                // Station 1: Vijayawada Central
                ChargingStation s1 = new ChargingStation(null, "Vijayawada Central EV Station", "MG Road, Vijayawada Central", 1L, 14.50, 6, 4, "AVAILABLE", 16.5062, 80.6480, new ArrayList<>());
                s1 = stationRepo.save(s1);
                createPort(s1, 1, "CCS2", 60.0, "OCCUPIED", portRepo);
                createPort(s1, 2, "CCS2", 60.0, "OCCUPIED", portRepo);
                createPort(s1, 3, "Type 2 AC", 22.0, "AVAILABLE", portRepo);
                createPort(s1, 4, "Type 2 AC", 22.0, "AVAILABLE", portRepo);
                createPort(s1, 5, "CHAdeMO", 50.0, "AVAILABLE", portRepo);
                createPort(s1, 6, "CCS2", 60.0, "AVAILABLE", portRepo);

                // Station 2: Benz Circle
                ChargingStation s2 = new ChargingStation(null, "Benz Circle EV Charging Hub", "Near Benz Circle Flyover, Vijayawada", 2L, 16.00, 6, 2, "AVAILABLE", 16.5008, 80.6542, new ArrayList<>());
                s2 = stationRepo.save(s2);
                createPort(s2, 1, "CCS2", 120.0, "OCCUPIED", portRepo);
                createPort(s2, 2, "CCS2", 120.0, "OCCUPIED", portRepo);
                createPort(s2, 3, "CCS2", 60.0, "OCCUPIED", portRepo);
                createPort(s2, 4, "CCS2", 60.0, "OCCUPIED", portRepo);
                createPort(s2, 5, "Type 2 AC", 22.0, "AVAILABLE", portRepo);
                createPort(s2, 6, "Type 2 AC", 22.0, "AVAILABLE", portRepo);

                // Station 3: Gollapudi
                ChargingStation s3 = new ChargingStation(null, "Gollapudi EV Power Station", "NH65, Gollapudi Bypass, Vijayawada", 3L, 11.50, 4, 3, "AVAILABLE", 16.5412, 80.5821, new ArrayList<>());
                s3 = stationRepo.save(s3);
                createPort(s3, 1, "CCS2", 50.0, "OCCUPIED", portRepo);
                createPort(s3, 2, "CCS2", 50.0, "AVAILABLE", portRepo);
                createPort(s3, 3, "Type 2 AC", 22.0, "AVAILABLE", portRepo);
                createPort(s3, 4, "Type 2 AC", 22.0, "AVAILABLE", portRepo);

                // Station 4: Auto Nagar
                ChargingStation s4 = new ChargingStation(null, "Auto Nagar EV Fast Station", "100 Feet Road, Auto Nagar, Vijayawada", 4L, 13.00, 4, 3, "AVAILABLE", 16.4950, 80.6720, new ArrayList<>());
                s4 = stationRepo.save(s4);
                createPort(s4, 1, "CCS2", 60.0, "OCCUPIED", portRepo);
                createPort(s4, 2, "CCS2", 60.0, "AVAILABLE", portRepo);
                createPort(s4, 3, "Type 2 AC", 22.0, "AVAILABLE", portRepo);
                createPort(s4, 4, "CHAdeMO", 50.0, "AVAILABLE", portRepo);

                // Station 5: Mangalagiri
                ChargingStation s5 = new ChargingStation(null, "Mangalagiri EV Station", "Near AIIMS, Mangalagiri", 5L, 10.50, 4, 4, "AVAILABLE", 16.4410, 80.5580, new ArrayList<>());
                s5 = stationRepo.save(s5);
                createPort(s5, 1, "CCS2", 60.0, "AVAILABLE", portRepo);
                createPort(s5, 2, "CCS2", 60.0, "AVAILABLE", portRepo);
                createPort(s5, 3, "Type 2 AC", 22.0, "AVAILABLE", portRepo);
                createPort(s5, 4, "Type 2 AC", 22.0, "AVAILABLE", portRepo);

                System.out.println("5 Vijayawada EV Stations initialized in Station Service.");
            }
        };
    }

    private void createPort(ChargingStation station, int portNum, String type, double kw, String status, ChargingPortRepository portRepo) {
        ChargingPort port = new ChargingPort(null, station, portNum, type, kw, status);
        portRepo.save(port);
    }
}
