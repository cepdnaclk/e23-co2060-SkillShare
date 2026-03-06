package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.repository.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkillService {

    @Autowired
    private SkillRepository skillRepository;

    public Skill addSkill(Skill skill) {
        // Logic: Convert to lowercase before saving to keep data clean
        skill.setName(skill.getName().toLowerCase());
        return skillRepository.save(skill);
    }

    public List<Skill> searchSkills(String keyword) {
        // Logic: If the user types nothing, return an empty list to save bandwidth
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return skillRepository.findByNameContainingIgnoreCase(keyword);
    }
}