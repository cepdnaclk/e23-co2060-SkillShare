package com.zenware.skillsharebackend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class UserSkillRequest {
    private UUID userId;
    private Long skillId;
    private String skillType; // "TEACH" or "LEARN"
}