package com.zenware.skillsharebackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // The user who typed the message
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    // The user receiving the message
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    // Using columnDefinition = "TEXT" allows for long messages
    // instead of the default 255-character limit in PostgreSQL.
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    // Automatically stamps the exact millisecond the message hits the database
    @CreationTimestamp
    @Column(name = "timestamp", updatable = false)
    private LocalDateTime timestamp;

    // To display a notification dot or "Read" status in the UI
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;
}