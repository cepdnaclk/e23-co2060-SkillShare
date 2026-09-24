package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.NotificationType;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.entity.SessionStatus;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.zenware.skillsharebackend.config.SessionProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionExpirationProcessor {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final AvailabilityRepository availabilityRepository;
    private final NotificationService notificationService;
    private final GamificationService gamificationService;
    private final SessionProperties sessionProperties;
    private final Clock clock;

    @Transactional
    public boolean processPendingExpiration(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalStateException("Session not found: " + sessionId));

        if (session.getStatus() != SessionStatus.PENDING) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime timeoutThreshold = now.minusHours(sessionProperties.getPendingResponseTimeoutHours());

        boolean isTimeExpired = (session.getStartTime() != null && !now.isBefore(session.getStartTime())) ||
                                (session.getCreatedAt() != null && !timeoutThreshold.isBefore(session.getCreatedAt()));

        if (!isTimeExpired) {
            return false;
        }

        int updated = sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.EXPIRED,
                List.of(SessionStatus.PENDING)
        );

        if (updated == 1) {
            userRepository.addCreditsAtomically(session.getLearner().getId(), 10);

            if (session.getAvailabilityId() != null) {
                int released = availabilityRepository.releaseAvailabilityAtomically(session.getAvailabilityId(), session.getId());
                if (released != 1) {
                    throw new IllegalStateException("Failed to release availability: ownership mismatch or already released");
                }
            }

            notificationService.sendNotification(session.getLearner(), "Your session request expired. Your 10 credits have been refunded.", NotificationType.SYSTEM_ALERT);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean processAcceptedCompletion(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalStateException("Session not found: " + sessionId));

        if (session.getStatus() != SessionStatus.ACCEPTED) {
            return false;
        }

        if (session.getEndTime() == null || !LocalDateTime.now(clock).isAfter(session.getEndTime())) {
            return false;
        }

        int updated = sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.COMPLETED,
                List.of(SessionStatus.ACCEPTED)
        );

        if (updated == 1) {
            userRepository.addCreditsAtomically(session.getMentor().getId(), 10);
            gamificationService.awardSessionCompletionXp(session.getLearner());
            gamificationService.awardSessionCompletionXp(session.getMentor());
            notificationService.sendNotification(session.getMentor(), "The session time passed and was auto-completed. You received 10 credits.", NotificationType.SYSTEM_ALERT);
            return true;
        }
        return false;
    }
}
