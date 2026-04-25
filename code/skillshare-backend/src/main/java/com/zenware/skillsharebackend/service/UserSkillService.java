package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.UserSkillRequest;
import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.entity.UserSkill;
import com.zenware.skillsharebackend.entity.UserSkillId;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSkillService {

    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    @Transactional
    public UserSkill addUserSkill(UserSkillRequest request) {

        // Logic 1: Fetch User
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        // Logic 2: Clean name
        String cleanName = request.getSkillName().trim();
        if (cleanName.isEmpty()) {
            throw new IllegalArgumentException("Skill name cannot be empty!");
        }

        // Logic 3: Find or Create Engine
        Skill skill = skillRepository.findByNameIgnoreCase(cleanName)
                .orElseGet(() -> {
                    Skill brandNewSkill = new Skill();
                    String formattedName = cleanName.substring(0, 1).toUpperCase() + cleanName.substring(1).toLowerCase();
                    brandNewSkill.setName(formattedName);

                    if (request.getSkillCategory() != null && !request.getSkillCategory().trim().isEmpty()) {
                        String cleanCat = request.getSkillCategory().trim();
                        String formattedCat = cleanCat.substring(0, 1).toUpperCase() + cleanCat.substring(1).toLowerCase();
                        brandNewSkill.setCategory(formattedCat);
                    } else {
                        brandNewSkill.setCategory("User Defined");
                    }
                    return skillRepository.save(brandNewSkill);
                });

        // Logic 4: Primary Key Setup
        UserSkill userSkill = getUserSkill(request, user, skill);

        return userSkillRepository.save(userSkill);
    }

    private static @NonNull UserSkill getUserSkill(UserSkillRequest request, User user, Skill skill) {
        UserSkillId id = new UserSkillId();
        id.setUserId(user.getId());
        id.setSkillId(skill.getId());

        // Logic 5: Type Guard Rail
        String type = request.getSkillType().trim().toUpperCase();
        if (!type.equals("TEACH") && !type.equals("LEARN")) {
            throw new IllegalArgumentException("Invalid Skill type. Must be TEACH or LEARN.");
        }
        id.setSkillType(type);

        // Logic 6: Save Linkage
        UserSkill userSkill = new UserSkill();
        userSkill.setId(id);
        userSkill.setUser(user);
        userSkill.setSkill(skill);
        return userSkill;
    }
}