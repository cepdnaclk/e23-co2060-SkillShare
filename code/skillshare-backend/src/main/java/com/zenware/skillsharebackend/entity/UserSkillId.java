package com.zenware.skillsharebackend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;
import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Data
public class UserSkillId implements Serializable {

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "skill_id")
    private Long skillId;

    @Column(name = "skill_type")
    private String skillType; // "TEACH" or "LEARN"
}