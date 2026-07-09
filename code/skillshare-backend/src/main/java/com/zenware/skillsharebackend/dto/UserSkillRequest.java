package com.zenware.skillsharebackend.dto;

import lombok.Data;

@Data
public class UserSkillRequest {

    // SECURITY UPGRADE: 'userId' has been permanently removed!
    // We will extract the exact user securely from the JWT token.

    private String skillName;
    private String skillType; // "TEACH" or "LEARN"
    private String skillCategory;
}