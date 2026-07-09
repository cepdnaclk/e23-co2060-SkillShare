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
public class UserSkillDto {
    private UUID userId;
    private String userName;
    private String userBio;
    private Double userRatingAvg;
    private Integer userReputationScore;
    
    private UUID skillId;
    private String skillType;
    private String skillName;
    private String skillCategory;
}
