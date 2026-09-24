package com.zenware.skillsharebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponse {

    private UUID id;

    private UUID mentorId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Boolean isBooked;

    private UUID activeSessionId;

    /*
     * null when the slot is genuinely free.
     * INDIVIDUAL when occupied by an individual session.
     * GROUP when occupied by a group session.
     */
    private String sessionType;

    /*
     * Only relevant for group sessions.
     */
    private String groupStatus;

    /*
     * Maximum number of learners in the group.
     */
    private Integer groupCapacity;

    /*
     * Number of learners who have currently JOINED.
     */
    private Integer groupJoinedCount;
}