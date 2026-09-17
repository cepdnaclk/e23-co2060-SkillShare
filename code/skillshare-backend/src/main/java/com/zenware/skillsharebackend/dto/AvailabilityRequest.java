package com.zenware.skillsharebackend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import jakarta.validation.constraints.NotNull;

@Data
public class AvailabilityRequest {

    // SECURITY UPGRADE: 'userId' has been removed!
    // The Mentor's identity will be securely extracted from their JWT token
    // in the AvailabilityService. Hackers cannot spoof other users' slots now.

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;
}
