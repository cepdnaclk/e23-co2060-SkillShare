package com.zenware.skillsharebackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(
        name = "app.session.expiration.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class SessionExpirationScheduler {

    private final SessionService sessionService;

    @Scheduled(fixedDelay = 60000)
    public void autoExpireSessions() {
        try {
            int expiredCount = sessionService.expireOverdueSessions();
            if (expiredCount > 0) {
                log.info("Successfully expired/auto-completed {} sessions.", expiredCount);
            } else {
                log.debug("No overdue sessions to expire.");
            }
        } catch (Exception e) {
            log.error("Failed to execute scheduled session expiration", e);
        }
    }
}
