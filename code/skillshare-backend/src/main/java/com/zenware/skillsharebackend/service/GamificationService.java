package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserRepository userRepository;

    // Define exactly how much XP each action is worth
    private static final int XP_PROFILE_COMPLETION = 50;
    private static final int XP_SESSION_COMPLETED = 20;
    private static final int XP_FIVE_STAR_RATING = 15;

    /**
     * Call this when a user finishes filling out their bio and skills
     */
    @Transactional
    public void awardProfileCompletionXp(User user) {
        awardXp(user.getId(), XP_PROFILE_COMPLETION);
    }

    /**
     * Call this when a mentor or learner successfully finishes a scheduled session
     */
    @Transactional
    public void awardSessionCompletionXp(User user) {
        awardXp(user.getId(), XP_SESSION_COMPLETED);
    }

    /**
     * Call this when a mentor receives a 5-star review
     */
    @Transactional
    public void awardFiveStarRatingXp(User user) {
        awardXp(user.getId(), XP_FIVE_STAR_RATING);
    }

    // --- THE ATOMIC GAMIFICATION ENGINE ---

    /**
     * Core atomic logic to add XP and calculate if the user leveled up
     * safely bypassing any concurrency race conditions.
     */
    @Transactional
    public void awardXp(UUID userId, int xpToAdd) {
        // 1. Force PostgreSQL to safely and atomically add the XP.
        userRepository.addXpAtomically(userId, xpToAdd);

        // 2. Fetch the newly updated user record with the fresh XP.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 3. Check for a Level Up!
        int currentXp = user.getXp() != null ? user.getXp() : 0;
        int expectedLevel = calculateLevel(currentXp);

        int currentLevel = user.getLevel() != null ? user.getLevel() : 1;

        if (currentLevel < expectedLevel) {
            user.setLevel(expectedLevel);
            userRepository.save(user); // Safe to save here, the XP is already secured natively

            // Placeholder: Wire this to your WebSocket tunnel later for live Level-Up animations!
            System.out.println("🎉 User " + user.getFullName() + " leveled up to Level " + expectedLevel + "!");
        }
    }

    /**
     * Simple leveling algorithm.
     * E.g., Every 100 XP = 1 Level.
     * Level 1: 0-99 XP
     * Level 2: 100-199 XP
     * Level 3: 200-299 XP
     */
    private int calculateLevel(int totalXp) {
        return (totalXp / 100) + 1;
    }
}