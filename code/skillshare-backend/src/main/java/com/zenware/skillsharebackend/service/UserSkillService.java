package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.UserSearchResponse;
import com.zenware.skillsharebackend.dto.UserSkillRequest;
import com.zenware.skillsharebackend.dto.UserSkillDto;
import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.entity.UserSkill;
import com.zenware.skillsharebackend.entity.UserSkillId;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserSkillService {

    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    // --- THE SECURITY ENGINE ---
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));
    }

    @Transactional
    public UserSkillDto addUserSkill(UserSkillRequest request) {

        // SECURITY: Fetch User directly from the token!
        User user = getAuthenticatedUser();

        // DEFENSIVE PROGRAMMING: Prevent NullPointerException
        if (request.getSkillName() == null || request.getSkillName().trim().isEmpty()) {
            throw new IllegalArgumentException("Skill name cannot be empty!");
        }
        String cleanName = request.getSkillName().trim();

        // Logic: Find or Create Engine
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

        // DEFENSIVE PROGRAMMING: Prevent NullPointerException
        if (request.getSkillType() == null || request.getSkillType().trim().isEmpty()) {
            throw new IllegalArgumentException("Skill type cannot be empty!");
        }

        // Type Guard Rail
        String type = request.getSkillType().trim().toUpperCase();
        if (!type.equals("TEACH") && !type.equals("LEARN")) {
            throw new IllegalArgumentException("Invalid Skill type. Must be TEACH or LEARN.");
        }

        // Clean Primary Key Setup using Builder
        UserSkillId id = UserSkillId.builder()
                .userId(user.getId())
                .skillId(skill.getId())
                .skillType(type)
                .build();

        UserSkill userSkill = UserSkill.builder()
                .id(id)
                .user(user)
                .skill(skill)
                .build();

        UserSkill saved = userSkillRepository.save(userSkill);
        return toDto(saved);
    }

    private UserSkillDto toDto(UserSkill userSkill) {
        return UserSkillDto.builder()
                .userId(userSkill.getUser().getId())
                .userName(userSkill.getUser().getFullName())
                .userBio(userSkill.getUser().getBio())
                .userRatingAvg(0.0) // We will hardcode to 0.0 for now, unless User entity has ratingAvg
                .userReputationScore(userSkill.getUser().getReputationScore() != null ? userSkill.getUser().getReputationScore() : 0)
                .skillId(userSkill.getSkill().getId())
                .skillType(userSkill.getId().getSkillType())
                .skillName(userSkill.getSkill().getName())
                .skillCategory(userSkill.getSkill().getCategory())
                .build();
    }

    // --- NEW FEATURE: Secure Delete ---
    @Transactional
    public void deleteUserSkill(UUID skillId, String skillType) {
        User me = getAuthenticatedUser();

        UserSkillId id = UserSkillId.builder()
                .userId(me.getId())
                .skillId(skillId)
                .skillType(skillType.toUpperCase())
                .build();

        // LOGIC: The user can only delete their own records because the ID requires their JWT token ID!
        if (!userSkillRepository.existsById(id)) {
            throw new IllegalArgumentException("Skill linkage not found in your profile!");
        }

        userSkillRepository.deleteById(id);
    }

    @Transactional
    public List<UserSkillDto> getUserProfileSkills(UUID userId) {
        return userSkillRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<UserSkillDto> getUserTeachingSkills(UUID userId) {
        return userSkillRepository.findByUserIdAndIdSkillType(userId, "TEACH").stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<UserSkillDto> getUserLearningSkills(UUID userId) {
        return userSkillRepository.findByUserIdAndIdSkillType(userId, "LEARN").stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // --- DISCOVERY LOGIC ---
    @Transactional
    public List<UserSkillDto> findMentorsBySkill(UUID skillId) {
        // We only want users who are teaching ("TEACH") this skill
        return userSkillRepository.findByIdSkillIdAndIdSkillType(skillId, "TEACH").stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }


    // --- Auto-Suggestion Logic ---
    public List<UserSearchResponse> searchUserProfiles(String name) {
        if (name == null || name.trim().isEmpty()) {
            return List.of();
        }

        // 1. Fetch the UserSkills using the magic method
        return userSkillRepository.findByUserFullNameContainingIgnoreCase(name.trim())
                .stream()
                // 2. Extract the User from the UserSkill
                .map(UserSkill::getUser)
                // 3. Keep only the unique users
                .distinct()
                .limit(10)
                .map(user -> new UserSearchResponse(user.getId(), user.getFullName()))
                .collect(Collectors.toList());
    }
}