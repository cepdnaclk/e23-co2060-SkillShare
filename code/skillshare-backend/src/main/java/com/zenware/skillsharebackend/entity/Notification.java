package com.zenware.skillsharebackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@Builder // LOGIC: Modern builder pattern
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // LOGIC: Upgraded to specific UUID strategy
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    @JsonIgnore // Prevents infinite loops when sending JSON to the frontend
    private User recipient;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    // LOGIC: Boolean object type works perfectly with Lombok Builder and Jackson JSON
    @Column(nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    // LOGIC: Much cleaner than @PrePersist. Hibernate handles this automatically now!
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}