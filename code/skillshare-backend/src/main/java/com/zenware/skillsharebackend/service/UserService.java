package com.zenware.skillsharebackend.service;

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
    // LOGIC: Extracts the exact user making the request from the JWT Token!
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    // SECURITY UPGRADE: True "Zero Trust". We don't even ask for an ID anymore.
    // The system just updates the bio of whoever holds the JWT token!
    @Transactional
    public User updateMyBio(String bio) {
        User me = getAuthenticatedUser();
        me.setBio(bio);
        
        // Idempotency Check
        if (me.getIsProfileCompleted() == null || !me.getIsProfileCompleted()) {
            gamificationService.awardProfileCompletionXp(me);
            me.setIsProfileCompleted(true);
        }
        
        return userRepository.save(me);
    }
}