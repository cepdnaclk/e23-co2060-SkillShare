package com.zenware.skillsharebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPrivateDto {
    private UUID id;
    private String fullName;
    private String email;
    private String bio;
    private String profilePictureUrl;
    private Integer credits;
    private Integer xp;
    private Integer level;
    private Integer reputationScore;
    private Boolean isProfileCompleted;
}
