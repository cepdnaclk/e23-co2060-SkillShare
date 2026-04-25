package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.UserSkillRequest;
import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor // Using the cleaner constructor injection we discussed!
public class UserService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    // LOGIC: We removed 'registerNewUser' from here because it is now handled
    // more securely in AuthenticationService.java (with hashing and JWT).

    // 1. Fetch User Profile
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
    }

    // 2. Update Profile (Example)
    @Transactional
    public User updateBio(UUID id, String newBio) {
        User user = getUserById(id);
        user.setBio(newBio);
        return userRepository.save(user);
    }

    // 3. The Dynamic Skill Engine (Previously built)
    @Transactional
    public void addSkillToUser(UserSkillRequest request) {
        User user = getUserById(request.getUserId());
        String cleanName = request.getSkillName().trim();

        if (cleanName.isEmpty()) {
            throw new IllegalArgumentException("Skill name cannot be empty!");
        }

        Skill skill = skillRepository.findByNameIgnoreCase(cleanName)
                .orElseGet(() -> {
                    Skill brandNewSkill = new Skill();
                    String formattedName = cleanName.substring(0, 1).toUpperCase() + cleanName.substring(1).toLowerCase();
                    brandNewSkill.setName(formattedName);
                    return skillRepository.save(brandNewSkill);
                });

        if ("TEACH".equalsIgnoreCase(request.getSkillType())) {
            user.getTeachingSkills().add(skill);
        } else if ("LEARN".equalsIgnoreCase(request.getSkillType())) {
            user.getLearningSkills().add(skill);
        } else {
            throw new IllegalArgumentException("Invalid type. Must be TEACH or LEARN.");
        }

        userRepository.save(user);
    }
}