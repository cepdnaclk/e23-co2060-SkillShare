package com.zenware.skillsharebackend.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(
        name = "app.availability.expiration.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class AvailabilityExpirationScheduler {

    private final AvailabilityService availabilityService;

    @Scheduled(fixedDelay = 300000) // every 5 minutes — cleanup is lower-urgency than session expiry
    public void autoCleanupExpiredSlots() {
        try {
            int deletedCount = availabilityService.cleanupExpiredUnbookedSlots();
            if (deletedCount > 0) {
                log.info("Successfully deleted {} expired, never-booked availability slots.", deletedCount);
            } else {
                log.debug("No expired availability slots to clean up.");
            }
        } catch (Exception e) {
            log.error("Failed to execute scheduled availability cleanup", e);
        }
    }
}