package com.zenware.skillsharebackend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AvailabilityRequest {
    private UUID userId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}