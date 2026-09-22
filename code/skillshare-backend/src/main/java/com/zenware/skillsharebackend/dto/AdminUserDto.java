package com.zenware.skillsharebackend.dto;

import com.zenware.skillsharebackend.entity.Role;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserDto(
        UUID id,
        String fullName,
        String email,
        Role role,
        Boolean isActive,
        Integer credits,
        Integer xp,
        Integer level,
        Integer reputationScore,
        Boolean isProfileCompleted,
        LocalDateTime createdAt
) {
}
