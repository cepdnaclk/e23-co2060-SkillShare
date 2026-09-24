package com.zenware.skillsharebackend.dto;

import lombok.Data;

import java.util.UUID;
import com.zenware.skillsharebackend.entity.SessionType;

@Data
public class SessionRequest {

    // SECURITY UPGRADE: 'learnerId' has been completely removed!
    // We will extract the learner's identity securely from the JWT token
    // in the Service layer so hackers cannot drain other people's credits.

    private UUID skillId;
    private UUID availabilityId;
    private SessionType sessionType;
    private Integer capacity;
}
