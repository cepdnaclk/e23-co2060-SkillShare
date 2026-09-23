package com.zenware.skillsharebackend.dto;

public record AdminOverviewDto(
        long totalUsers,
        long activeUsers,
        long inactiveUsers,
        long totalSkills,
        long totalSessions,
        long pendingSessions,
        long completedSessions,
        long totalFeedback
) {
}
