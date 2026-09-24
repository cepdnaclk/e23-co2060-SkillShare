package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.UserPublicDto;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    // --- THE SECURITY ENGINE ---
    public User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    // 🎯 PUBLIC PROFILE DTO MAPPER
    public UserPublicDto getPublicUserById(UUID id) {
        User user = getUserById(id);
        return toPublicDto(user);
    }

    public UserPublicDto toPublicDto(User user) {
        return UserPublicDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .bio(user.getBio())
                // 🛑 CRITICAL FIX: Explicitly mapping isActive (defaults to true if null)
                .isActive(user.getIsActive() != null ? user.getIsActive() : true)
                .xp(user.getXp())
                .level(user.getLevel())
                .reputationScore(user.getReputationScore())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build();
    }

    @Transactional
    public User updateMyBio(String bio) {
        User me = getAuthenticatedUser();
        me.setBio(bio);

        if (me.getIsProfileCompleted() == null || !me.getIsProfileCompleted()) {
            gamificationService.awardProfileCompletionXp(me);
            me.setIsProfileCompleted(true);
        }

        return userRepository.save(me);
    }
}