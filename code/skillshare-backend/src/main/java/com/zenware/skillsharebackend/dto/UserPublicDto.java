package com.zenware.skillsharebackend.dto;

import java.util.UUID;

import com.zenware.skillsharebackend.entity.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserPublicDto {
    private UUID id;
    private String fullName;
    private String bio;

    // Role (e.g. so the frontend can show an "Admin" badge on public profiles)
    private Role role;

    // Gamification Stats
    private Integer xp;
    private Integer level;
    private Integer reputationScore;

    // We will use this in the next step!
    private String profilePictureUrl;
    private Boolean isActive;

}
