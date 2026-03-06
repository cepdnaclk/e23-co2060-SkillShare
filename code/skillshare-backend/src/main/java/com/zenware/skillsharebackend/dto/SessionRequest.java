package com.zenware.skillsharebackend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class SessionRequest {
    private UUID learnerId;
    private Long skillId;
    private Long availabilityId;
}