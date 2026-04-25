package com.zenware.skillsharebackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "feedbacks")
@Data
@Builder // LOGIC: Added Builder pattern for clean creation
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // LOGIC: Added FetchType.LAZY to prevent massive database slow-downs
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    // The person leaving the feedback (Identified securely via JWT)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "giver_id", nullable = false)
    private User giver;

    // The person receiving the feedback (Deduced automatically from the Session)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(name = "feedback_tag", nullable = false)
    private String feedbackTag; // e.g., "Great Explanations"

    @Column(name = "weight", nullable = false)
    private Integer weight; // e.g., +5 or -2

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}