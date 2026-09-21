package com.evcharging.notificationservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private Boolean isRead = false;

    private String type; // SESSION_START, SESSION_STOP, GRID_OVERLOAD, STATION_AVAILABILITY, INFO

    // No-arg constructor (required by JPA)
    public Notification() {}

    // All-arg constructor
    public Notification(Long id, Long userId, String title, String message,
                        LocalDateTime timestamp, Boolean isRead, String type) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.timestamp = timestamp;
        this.isRead = isRead;
        this.type = type;
    }

    // Getters
    public Long getId()                 { return id; }
    public Long getUserId()             { return userId; }
    public String getTitle()            { return title; }
    public String getMessage()          { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public Boolean getIsRead()          { return isRead; }
    public Boolean isRead()             { return isRead; }
    public String getType()             { return type; }

    // Setters
    public void setId(Long id)                        { this.id = id; }
    public void setUserId(Long userId)                { this.userId = userId; }
    public void setTitle(String title)                { this.title = title; }
    public void setMessage(String message)            { this.message = message; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setIsRead(Boolean isRead)             { this.isRead = isRead; }
    public void setType(String type)                  { this.type = type; }
}
