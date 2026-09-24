package com.zenware.skillsharebackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "availabilities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Availability {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /*
     * The user who owns this availability slot.
     * In SkillShare this is the mentor.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    /*
     * IMPORTANT:
     *
     * This remains TRUE for a group session.
     *
     * We do NOT change this to false when a group is created.
     *
     * Instead:
     *
     * isBooked = true
     * activeSessionId = group session ID
     *
     * This prevents another individual session from booking
     * the same time slot.
     */
    @Column(name = "is_booked")
    @Builder.Default
    private Boolean isBooked = false;

    /*
     * The session currently occupying this availability.
     *
     * If this points to an INDIVIDUAL session:
     *     slot is hidden from learners.
     *
     * If this points to a GROUP session:
     *     slot remains visible as a group session.
     */
    @Column(name = "active_session_id")
    private UUID activeSessionId;
}