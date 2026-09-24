package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
class GamificationServiceIntegrationTest {

    @Autowired
    private GamificationService gamificationService;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("gamification@test.com");
        testUser.setFullName("Gamification Test");
        testUser.setPassword("password");
        testUser.setCredits(0);
        testUser.setReputationScore(0);
        testUser.setXp(0);
        testUser.setLevel(1);
        testUser = userRepository.saveAndFlush(testUser);
    }

    @Test
    void testXpAwardBelow100_DoesNotLevelUp() {
        gamificationService.awardXp(testUser.getId(), 50);

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals(50, updatedUser.getXp());
        assertEquals(1, updatedUser.getLevel());
    }

    @Test
    void testXpAwardExactly100_IncrementsLevelAndResetsXp() {
        // First get to 80 XP
        gamificationService.awardXp(testUser.getId(), 80);
        
        // Add 20 to hit exactly 100
        gamificationService.awardXp(testUser.getId(), 20);

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals(0, updatedUser.getXp());
        assertEquals(2, updatedUser.getLevel());
    }

    @Test
    void testXpAwardCrossing100_IncrementsLevelAndResetsXpWithoutOverflow() {
        gamificationService.awardXp(testUser.getId(), 90);
        
        // Add 20, pushing total to 110. Should cap and reset.
        gamificationService.awardXp(testUser.getId(), 20);

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals(0, updatedUser.getXp()); // No overflow carried!
        assertEquals(2, updatedUser.getLevel());
    }

    @Test
    void testProfileCompletionAward_WorksNormally() {
        gamificationService.awardProfileCompletionXp(testUser);

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals(50, updatedUser.getXp()); // +50 XP for profile
        assertEquals(1, updatedUser.getLevel());
    }

    @Test
    void testSessionCompletionAward_WorksNormally() {
        gamificationService.awardSessionCompletionXp(testUser);

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals(20, updatedUser.getXp()); // +20 XP for session
        assertEquals(1, updatedUser.getLevel());
    }

    @Test
    void testFiveStarRatingAward_WorksNormally() {
        gamificationService.awardFiveStarRatingXp(testUser);

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals(15, updatedUser.getXp()); // +15 XP for rating
        assertEquals(1, updatedUser.getLevel());
    }

    @Test
    void testXpAwardWithNullLevel_InitializesLevelAndCalculatesCorrectly() {
        // Create user with explicit null level
        User nullLevelUser = new User();
        nullLevelUser.setEmail("null.level@test.com");
        nullLevelUser.setFullName("Null Level Test");
        nullLevelUser.setPassword("password");
        nullLevelUser.setCredits(0);
        nullLevelUser.setReputationScore(0);
        nullLevelUser.setXp(50);
        nullLevelUser.setLevel(null);
        nullLevelUser = userRepository.saveAndFlush(nullLevelUser);

        gamificationService.awardXp(nullLevelUser.getId(), 20);

        User updatedUser = userRepository.findById(nullLevelUser.getId()).orElseThrow();
        assertEquals(70, updatedUser.getXp());
        assertEquals(1, updatedUser.getLevel()); // Null level treated as 1
    }

    @Test
    void testXpAwardWithNullLevel_Crossing100_IncrementsAndResets() {
        // Create user with explicit null level
        User nullLevelUser = new User();
        nullLevelUser.setEmail("null.level.cross@test.com");
        nullLevelUser.setFullName("Null Level Cross Test");
        nullLevelUser.setPassword("password");
        nullLevelUser.setCredits(0);
        nullLevelUser.setReputationScore(0);
        nullLevelUser.setXp(90);
        nullLevelUser.setLevel(null);
        nullLevelUser = userRepository.saveAndFlush(nullLevelUser);

        gamificationService.awardXp(nullLevelUser.getId(), 20); // 90 + 20 = 110

        User updatedUser = userRepository.findById(nullLevelUser.getId()).orElseThrow();
        assertEquals(0, updatedUser.getXp()); // Resets to 0
        assertEquals(2, updatedUser.getLevel()); // Null level treated as 1, plus 1 = 2
    }
}
