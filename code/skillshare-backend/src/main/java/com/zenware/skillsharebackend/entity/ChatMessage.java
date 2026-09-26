package com.zenware.skillsharebackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import com.zenware.skillsharebackend.persistence.ChatTimestampConverter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "authorities",
            "accountNonExpired", "accountNonLocked", "credentialsNonExpired", "enabled",
            "userSkills", "sessions", "feedbacks"})
    private User sender;

    // The user receiving the message
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "authorities",
            "accountNonExpired", "accountNonLocked", "credentialsNonExpired", "enabled",
            "userSkills", "sessions", "feedbacks"})
    private User receiver;

    // Using columnDefinition = "TEXT" allows for long messages
    // instead of the default 255-character limit in PostgreSQL.
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    // Keep the legacy timestamp column, but store UTC independently of the JVM timezone.
    @Convert(converter = ChatTimestampConverter.class)
    @JdbcTypeCode(SqlTypes.LOCAL_DATE_TIME)
    @Column(name = "timestamp", updatable = false)
    private Instant timestamp;

    @PrePersist
    void stampTimestamp() {
        // PostgreSQL timestamps retain microseconds; acknowledgements must match reloads exactly.
        timestamp = Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    // To display a notification dot or "Read" status in the UI
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;
}
