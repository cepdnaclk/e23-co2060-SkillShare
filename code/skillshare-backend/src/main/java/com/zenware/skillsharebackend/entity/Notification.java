package com.zenware.skillsharebackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    // LOGIC: Many notifications can belong to one User (The Recipient)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    @JsonIgnore // Prevents infinite loops when sending JSON to the frontend
    private User recipient;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    // LOGIC: Defaults to false so the UI knows to show a red "Unread" badge
    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // LOGIC: Automatically sets the timestamp right before saving to Postgres
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}