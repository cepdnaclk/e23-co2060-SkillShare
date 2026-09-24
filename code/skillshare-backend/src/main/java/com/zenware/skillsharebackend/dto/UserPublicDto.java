package com.zenware.skillsharebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserPublicDto {
    private UUID id;
    private String fullName;
    private String bio;

    // Account Status
    private Boolean isActive;

    // Gamification Stats
    private Integer xp;
    private Integer level;
    private Integer reputationScore;

    private String profilePictureUrl;
}