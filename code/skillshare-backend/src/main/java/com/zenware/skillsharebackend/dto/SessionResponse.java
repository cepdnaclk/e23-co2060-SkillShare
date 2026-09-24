package com.zenware.skillsharebackend.dto;

import com.zenware.skillsharebackend.entity.SessionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import com.zenware.skillsharebackend.entity.SessionType;

@Data
@Builder
public class SessionResponse {

    private UUID id;

    private UUID learnerId;
    private String learnerName;
    private String learnerProfilePictureUrl;

    private UUID mentorId;
    private String mentorName;
    private String mentorProfilePictureUrl;

    private UUID skillId;
    private String skillName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private SessionStatus status;
    private String meetingLink;
    private Integer creditValue;
    private LocalDateTime createdAt;
    private SessionType sessionType;
    private Integer capacity;
    private Integer participantCount;
    private List<SessionParticipantResponse> participants;

    // Added so the frontend can match a booked Availability slot back to the
    // group session occupying it (needed to keep group-session slots visible
    // on a mentor's profile instead of disappearing once reserved).
    private UUID availabilityId;
}