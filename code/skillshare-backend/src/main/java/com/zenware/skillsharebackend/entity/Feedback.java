package com.zenware.skillsharebackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Getter
@Setter
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // We must link the exact session so we know what class this was for.
    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    // The person clicking the button.
    @ManyToOne
    @JoinColumn(name = "giver_id", nullable = false)
    private User giver;

    // The person receiving the reputation score.
    @ManyToOne
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