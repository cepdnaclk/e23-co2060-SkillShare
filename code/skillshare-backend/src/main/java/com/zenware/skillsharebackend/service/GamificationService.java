package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
    public void awardProfileCompletionXp(User user) {
        addXpAndSave(user, XP_PROFILE_COMPLETION);
    }

    /**
     * Call this when a mentor or learner successfully finishes a scheduled session
     */
    public void awardSessionCompletionXp(User user) {
        addXpAndSave(user, XP_SESSION_COMPLETED);
    }

    /**
     * Call this when a mentor receives a 5-star review
     */
    public void awardFiveStarRatingXp(User user) {
        addXpAndSave(user, XP_FIVE_STAR_RATING);
    }

    /**
     * Core logic to add XP and calculate if the user leveled up
     */
    private void addXpAndSave(User user, int xpToAdd) {
        int currentXp = user.getXp() != null ? user.getXp() : 0;
        int newXp = currentXp + xpToAdd;

        user.setXp(newXp);
        user.setLevel(calculateLevel(newXp));

        // Save the updated user back to the database
        userRepository.save(user);
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