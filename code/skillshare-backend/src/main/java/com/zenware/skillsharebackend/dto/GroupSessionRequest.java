package com.zenware.skillsharebackend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class GroupSessionRequest {
    @NotNull private UUID skillId;
    @NotNull private UUID availabilityId;
    @NotNull @Min(2) @Max(5) private Integer capacity;
}
