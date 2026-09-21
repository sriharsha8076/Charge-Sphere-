package com.evcharging.userservice;

import com.evcharging.userservice.entity.User;
import com.evcharging.userservice.entity.Vehicle;
import com.evcharging.userservice.repository.UserRepository;
import com.evcharging.userservice.repository.VehicleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
@EnableDiscoveryClient
public class UserServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, VehicleRepository vehicleRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
                // Seed users with BCrypt-hashed passwords (not plain text)
                String hashedPassword = encoder.encode("password123");

                User user = new User(null, "user", "user@evcharging.com", hashedPassword, "Ravi Kumar", "ROLE_USER");
                User admin = new User(null, "admin", "admin@evcharging.com", hashedPassword, "Grid Administrator", "ROLE_ADMIN");

                userRepository.save(user);
                userRepository.save(admin);

                Vehicle v1 = new Vehicle(null, 1L, "Tata Nexon EV Max", 40.5, "AP16 EV 1001");
                Vehicle v2 = new Vehicle(null, 1L, "MG ZS EV", 50.3, "AP16 EV 2002");
                vehicleRepository.save(v1);
                vehicleRepository.save(v2);

                System.out.println("Default users & vehicles initialized with BCrypt-hashed passwords.");
            } else {
                // If existing users have plain-text passwords, re-hash them
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
                userRepository.findAll().forEach(u -> {
                    String pwd = u.getPassword();
                    if (pwd != null && !pwd.startsWith("$2a$") && !pwd.startsWith("$2b$") && !pwd.startsWith("[PROTECTED]")) {
                        u.setPassword(encoder.encode(pwd));
                        userRepository.save(u);
                        System.out.println("Re-hashed password for user: " + u.getUsername());
                    }
                });
            }
        };
    }
}
