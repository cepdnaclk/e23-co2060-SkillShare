package com.zenware.skillsharebackend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AvailabilityRequest {

    // SECURITY UPGRADE: 'userId' has been removed!
    // The Mentor's identity will be securely extracted from their JWT token
    // in the AvailabilityService. Hackers cannot spoof other users' slots now.

    private LocalDateTime startTime;
    private LocalDateTime endTime;
}