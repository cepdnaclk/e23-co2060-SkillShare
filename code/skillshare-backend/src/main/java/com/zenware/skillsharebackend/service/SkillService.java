package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor // MODERN: Replaces @Autowired field injection
public class SkillService {

    private final SkillRepository skillRepository;

    @Transactional
    public Skill addSkill(Skill skill) {
        // LOGIC: Standardization! Matches the formatting in UserSkillService.
        // Prevents duplicates like "java" and "Java" from existing in the DB.
        String cleanName = skill.getName().trim();
        if (cleanName.isEmpty()) {
            throw new IllegalArgumentException("Skill name cannot be empty!");
        }

        String formattedName = cleanName.substring(0, 1).toUpperCase() + cleanName.substring(1).toLowerCase();

        // Ensure we don't accidentally create a duplicate if someone hits this endpoint directly
        return skillRepository.findByNameIgnoreCase(formattedName)
                .orElseGet(() -> {
                    skill.setName(formattedName);
                    if (skill.getCategory() == null || skill.getCategory().trim().isEmpty()) {
                        skill.setCategory("General");
                    }
                    return skillRepository.save(skill);
                });
    }

    public List<Skill> searchSkills(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of(); // Return empty list instead of null to prevent frontend crashes
        }
        return skillRepository.findByNameContainingIgnoreCase(keyword.trim());
    }

    // Added to support the 'GET /api/skills' endpoint from your API Blueprint
    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }
}