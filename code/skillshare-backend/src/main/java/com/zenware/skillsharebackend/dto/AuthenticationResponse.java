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
public class AuthenticationResponse {
    private String token;

    // --- Sending basic user info to the frontend! ---
    private UUID userId;
    private String fullName;
    private String email;
    private String role;

    private Integer xp;
    private Integer level;
    private Integer credits;
    private Integer reputationScore;
}