package com.zenware.skillsharebackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "sessions")
@Data
@Builder // LOGIC: Allows us to build sessions cleanly: Session.builder().status(...).build();
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // LOGIC: Added FetchType.LAZY for performance.
    // It prevents pulling the entire User object unless explicitly requested.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private User learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default // LOGIC: Ensures the Builder pattern respects our default value
    private SessionStatus status = SessionStatus.PENDING;

    // --- ESCROW SYSTEM VARIABLES ---

    // LOGIC: How much this session costs (10 credits based on your README blueprint)
    @Column(name = "credit_value", nullable = false)
    @Builder.Default
    private Integer creditValue = 10;

    // LOGIC: For the mentor to drop a Zoom/Meet link when they ACCEPT
    @Column(name = "meeting_link")
    private String meetingLink;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}