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

    // --- THE DISCOVERY ENGINE ---
    // LOGIC: Finds all users who are tagged as "TEACH" for a specific skill ID.
    // This is how the Learner finds a list of Mentors!
    List<UserSkill> findByIdSkillIdAndIdSkillType(UUID skillId, String skillType);

    // Auto-Suggest Profile Discovery (Magic Method) ---
    // LOGIC: Searches the UserSkill table for users matching the name.
    List<UserSkill> findByUserFullNameContainingIgnoreCase(String fullName);

    // Counts how many skills the user is offering to teach
    long countByUserIdAndIdSkillType(UUID userId, String skillType);
}