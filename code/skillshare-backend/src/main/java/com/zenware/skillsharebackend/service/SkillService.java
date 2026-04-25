package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor // MODERN: Replaces @Autowired field injection
public class SkillService {

    private final SkillRepository skillRepository;

    public Skill addSkill(Skill skill) {
        // LOGIC: Ensure consistency by keeping names lowercase in the DB index
        skill.setName(skill.getName().toLowerCase());
        return skillRepository.save(skill);
    }

    public List<Skill> searchSkills(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return skillRepository.findByNameContainingIgnoreCase(keyword);
    }
}