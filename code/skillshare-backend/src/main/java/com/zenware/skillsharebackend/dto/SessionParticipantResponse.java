package com.zenware.skillsharebackend.dto;

import com.zenware.skillsharebackend.entity.ParticipantStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SessionParticipantResponse {
    private UUID userId;
    private String userName;
    private String profilePictureUrl;
    private ParticipantStatus status;
    private LocalDateTime joinedAt;
    private UUID invitedByUserId;
    private String invitedByUserName;
}
