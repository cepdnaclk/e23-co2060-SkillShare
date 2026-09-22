package com.zenware.skillsharebackend.dto;

import com.zenware.skillsharebackend.entity.SessionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminSessionDto(
        UUID id,
        UUID learnerId,
        String learnerName,
        UUID mentorId,
        String mentorName,
        UUID skillId,
        String skillName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        SessionStatus status,
        Integer creditValue,
        LocalDateTime createdAt
) {
}
