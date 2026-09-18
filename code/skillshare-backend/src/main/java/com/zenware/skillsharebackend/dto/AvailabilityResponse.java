package com.zenware.skillsharebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponse {
    private UUID id;
    private UUID mentorId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @JsonProperty("isBooked")
    private Boolean isBooked;

    private UUID activeSessionId;
}
