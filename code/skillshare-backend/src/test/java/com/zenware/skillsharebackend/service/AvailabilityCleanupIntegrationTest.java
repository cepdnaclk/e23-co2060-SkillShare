package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.Availability;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
class AvailabilityCleanupIntegrationTest {

    @Autowired
    private AvailabilityService availabilityService;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("cleanup@test.com");
        testUser.setFullName("Cleanup Test");
        testUser.setPassword("password");
        testUser.setCredits(0);
        testUser.setReputationScore(0);
        testUser.setXp(0);
        testUser.setLevel(1);
        testUser = userRepository.saveAndFlush(testUser);

        now = LocalDateTime.now();
    }

    private void createAvailability(LocalDateTime startTime, boolean isBooked) {
        Availability a = new Availability();
        a.setUser(testUser);
        a.setStartTime(startTime);
        a.setEndTime(startTime.plusHours(1));
        a.setIsBooked(isBooked);
        availabilityRepository.saveAndFlush(a);
    }

    @Test
    void testCleanup_DeletesPastUnbookedSlots() {
        // 1. Past + unbooked → eligible for deletion
        createAvailability(now.minusDays(1), false);
        
        long countBefore = availabilityRepository.findByUserId(testUser.getId()).size();
        assertEquals(1, countBefore);

        int deleted = availabilityService.cleanupExpiredUnbookedSlots();

        assertEquals(0, availabilityRepository.findByUserId(testUser.getId()).size());
    }

    @Test
    void testCleanup_KeepsPastBookedSlots() {
        // 2. Past + booked → NOT deleted
        createAvailability(now.minusDays(1), true);

        int deleted = availabilityService.cleanupExpiredUnbookedSlots();

        assertEquals(0, deleted);
        assertEquals(1, availabilityRepository.findByUserId(testUser.getId()).size());
    }

    @Test
    void testCleanup_KeepsFutureUnbookedSlots() {
        // 3. Future + unbooked → NOT deleted
        createAvailability(now.plusDays(1), false);

        int deleted = availabilityService.cleanupExpiredUnbookedSlots();

        assertEquals(0, deleted);
        assertEquals(1, availabilityRepository.findByUserId(testUser.getId()).size());
    }

    @Test
    void testCleanup_KeepsFutureBookedSlots() {
        // 4. Future + booked → NOT deleted
        createAvailability(now.plusDays(1), true);

        int deleted = availabilityService.cleanupExpiredUnbookedSlots();

        assertEquals(0, deleted);
        assertEquals(1, availabilityRepository.findByUserId(testUser.getId()).size());
    }

    @Test
    void testCleanup_NoMatchingRecords_Safe() {
        // 5. No matching records → safe/no error
        int deleted = availabilityService.cleanupExpiredUnbookedSlots();

        assertEquals(0, deleted);
    }
}
