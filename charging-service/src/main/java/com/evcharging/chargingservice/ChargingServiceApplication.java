package com.evcharging.chargingservice;

import com.evcharging.chargingservice.entity.ChargingSession;
import com.evcharging.chargingservice.repository.ChargingSessionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
@EnableDiscoveryClient
public class ChargingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChargingServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initSessions(ChargingSessionRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                // Active session for user 1 at Station 1 (Vijayawada Central), Port 1
                ChargingSession active = new ChargingSession(
                        null, 1L, 1L, 1L, LocalDateTime.now().minusMinutes(25), null, 14.5, 210.25, "ACTIVE"
                );

                // Completed session for user 1 at Station 3 (Gollapudi), Port 13
                ChargingSession completed = new ChargingSession(
                        null, 1L, 3L, 13L, LocalDateTime.now().minusHours(3), LocalDateTime.now().minusHours(2), 28.0, 322.00, "COMPLETED"
                );

                repo.save(active);
                repo.save(completed);

                System.out.println("Initial charging sessions initialized in Charging Service.");
            }
        };
    }
}
