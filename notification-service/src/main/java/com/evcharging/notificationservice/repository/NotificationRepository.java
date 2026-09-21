package com.evcharging.notificationservice.repository;

import com.evcharging.notificationservice.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByTimestampDesc(Long userId);
    List<Notification> findByUserIdAndIsReadOrderByTimestampDesc(Long userId, Boolean isRead);
}
