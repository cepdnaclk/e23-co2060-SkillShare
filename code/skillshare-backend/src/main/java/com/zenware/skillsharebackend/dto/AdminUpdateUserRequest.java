package com.zenware.skillsharebackend.dto;

import com.zenware.skillsharebackend.entity.Role;

public record AdminUpdateUserRequest(
        Role role,
        Boolean isActive
) {
}
