package com.zenware.skillsharebackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardResponse {
    private String fullName;
    private Integer credits;
    private Integer bookedSessions;
    private Integer pendingRequests;
    private Integer skillsAdded;
    private Integer feedbackReceived;
    private Integer reputationScore;
    private Double averageRating;
}