package com.zenware.skillsharebackend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class UserSkillRequest {
    // This allows the frontend to send either an existing skill name or a brand new one.
    private UUID userId;
    private String skillName;
    private String skillType; // "TEACH" or "LEARN"
    private String skillCategory;
}