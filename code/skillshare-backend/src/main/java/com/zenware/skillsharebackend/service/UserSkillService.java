package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.UserSkillRequest;
import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.entity.UserSkill;
import com.zenware.skillsharebackend.entity.UserSkillId;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.repository.UserSkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserSkillService {

    @Autowired
    private UserSkillRepository userSkillRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SkillRepository skillRepository;

    public UserSkill addUserSkill(UserSkillRequest request) {

        // Logic 1: Fetch the real User and Skill from the database using the IDs
        // If they don't exist, throw an error immediately!
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        Skill skill = skillRepository.findById(request.getSkillId())
                .orElseThrow(() -> new IllegalArgumentException("Skill not found!"));

        // Logic 2: Create the Composite Primary Key
        UserSkillId id = new UserSkillId();
        id.setUserId(user.getId());
        id.setSkillId(skill.getId());
        id.setSkillType(request.getSkillType().toUpperCase()); // Force uppercase for safety

        // Logic 3: Assemble the final Entity
        UserSkill userSkill = new UserSkill();
        userSkill.setId(id);
        userSkill.setUser(user);
        userSkill.setSkill(skill);

        // Logic 4: Save to Postgres
        return userSkillRepository.save(userSkill);
    }
}