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
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserSkillService {

    @Autowired
    private UserSkillRepository userSkillRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Transactional
    public UserSkill addUserSkill(UserSkillRequest request) {

        // Logic 1: Fetch the real User from the database
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        // Logic 2: Clean the incoming skill name from the DTO
        String cleanName = request.getSkillName().trim();
        if (cleanName.isEmpty()) {
            throw new IllegalArgumentException("Skill name cannot be empty!");
        }

        // Logic 3: THE FIND OR CREATE ENGINE!
        Skill skill = skillRepository.findByNameIgnoreCase(cleanName)
                .orElseGet(() -> {
                    // IF NOT FOUND: We dynamically create it!
                    Skill brandNewSkill = new Skill();

                    // Format Skill Name (e.g., "python" -> "Python")
                    String formattedName = cleanName.substring(0, 1).toUpperCase() + cleanName.substring(1).toLowerCase();
                    brandNewSkill.setName(formattedName);

                    // LOGIC: Clean and Format the Category!
                    if (request.getSkillCategory() != null && !request.getSkillCategory().trim().isEmpty()) {
                        String cleanCat = request.getSkillCategory().trim();
                        // Format Category (e.g., "technology" -> "Technology")
                        String formattedCat = cleanCat.substring(0, 1).toUpperCase() + cleanCat.substring(1).toLowerCase();
                        brandNewSkill.setCategory(formattedCat);
                    } else {
                        brandNewSkill.setCategory("User Defined");
                    }

                    // Save it to Postgres so it instantly gets a real ID
                    return skillRepository.save(brandNewSkill);
                });

        // Logic 4: Create the Composite Primary Key using the found/created Skill ID
        UserSkillId id = new UserSkillId();
        id.setUserId(user.getId());
        id.setSkillId(skill.getId());

        // --- THE SKILL TYPE GUARD RAIL ---
        // LOGIC: We force it to act exactly like an Enum. If it's not TEACH or LEARN, we crash it!
        String type = request.getSkillType().trim().toUpperCase();
        if (!type.equals("TEACH") && !type.equals("LEARN")) {
            throw new IllegalArgumentException("Security Violation: Skill type must be exactly 'TEACH' or 'LEARN'.");
        }
        id.setSkillType(type);
        // -----------------------------------------

        // Logic 5: Assemble the final Entity
        UserSkill userSkill = new UserSkill();
        userSkill.setId(id);
        userSkill.setUser(user);
        userSkill.setSkill(skill);

        // Logic 6: Save the linkage to Postgres!
        return userSkillRepository.save(userSkill);
    }
}