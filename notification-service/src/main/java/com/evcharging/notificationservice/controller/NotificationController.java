package com.evcharging.notificationservice.controller;

import com.evcharging.notificationservice.entity.Notification;
import com.evcharging.notificationservice.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @PostMapping("/send")
    public ResponseEntity<Notification> sendNotification(@RequestBody Notification notification) {
        if (notification.getTimestamp() == null) {
            notification.setTimestamp(LocalDateTime.now());
        }
        if (notification.getIsRead() == null) {
            notification.setIsRead(false);
        }
        Notification saved = notificationRepository.save(notification);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByTimestampDesc(userId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(notificationRepository.findAll());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Notification not found");
        }
        Notification n = opt.get();
        n.setIsRead(true);
        return ResponseEntity.ok(notificationRepository.save(n));
    }
}
