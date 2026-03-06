package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.UserSkill;
import com.zenware.skillsharebackend.entity.UserSkillId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, UserSkillId> {

    // Logic: Find all skills (both TEACH and LEARN) for a specific user
    List<UserSkill> findByUserId(UUID userId);

    // Logic: Find all users who want to TEACH a specific skill
    List<UserSkill> findBySkillIdAndIdSkillType(Long skillId, String skillType);
}