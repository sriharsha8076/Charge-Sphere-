package com.evcharging.notificationservice;

import com.evcharging.notificationservice.entity.Notification;
import com.evcharging.notificationservice.repository.NotificationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
@EnableDiscoveryClient
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initNotifications(NotificationRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                repo.save(new Notification(
                        null, 1L, "Charging Started",
                        "Your charging session #1 at Vijayawada Central EV Station has started on Port 1.",
                        LocalDateTime.now().minusMinutes(25), true, "SESSION_START"
                ));
                repo.save(new Notification(
                        null, 1L, "Charging Completed",
                        "Session #2 completed. Total energy: 28.0 kWh, Total cost: ₹322.00.",
                        LocalDateTime.now().minusHours(1), false, "SESSION_STOP"
                ));

                System.out.println("Initial notifications seeded in Notification Service.");
            }
        };
    }
}
