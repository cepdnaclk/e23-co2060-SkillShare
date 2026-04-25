package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.UserSkill;
import com.zenware.skillsharebackend.entity.UserSkillId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, UserSkillId> {

    List<UserSkill> findByUserId(UUID userId);

    List<UserSkill> findBySkillIdAndIdSkillType(UUID skillId, String skillType);

    List<UserSkill> findByUserIdAndIdSkillType(UUID userId, String skillType);
}