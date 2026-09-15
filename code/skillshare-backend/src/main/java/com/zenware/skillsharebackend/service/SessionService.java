package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.dto.SessionResponse;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final AvailabilityRepository availabilityRepository;
    private final NotificationService notificationService;
    private final GamificationService gamificationService;
    private final SessionExpirationProcessor sessionExpirationProcessor;

    @Value("${app.session.pending-response-timeout-hours:24}")
    private int responseTimeoutHours;

    // --- THE SECURITY ENGINE ---
    // LOGIC: This helper method grabs the exact user currently making the API request
    // directly from the validated JWT token. No spoofing allowed!
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));
    }

    // -------------------------------------------------------
    // PRIVATE HELPER: Maps a Session entity to a safe DTO.
    // CRITICAL: This must be called while the Hibernate session is still open
    // (i.e. inside a @Transactional method) so all lazy proxies are available.
    // -------------------------------------------------------
    private SessionResponse toDto(Session session) {
        User learner = session.getLearner();
        User mentor  = session.getMentor();
        Skill skill  = session.getSkill();
        return SessionResponse.builder()
                .id(session.getId())
                .learnerId(learner.getId())
                .learnerName(learner.getFullName())
                .learnerProfilePictureUrl(learner.getProfilePictureUrl())
                .mentorId(mentor.getId())
                .mentorName(mentor.getFullName())
                .mentorProfilePictureUrl(mentor.getProfilePictureUrl())
                .skillId(skill.getId())
                .skillName(skill.getName())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus())
                .meetingLink(session.getMeetingLink())
                .creditValue(session.getCreditValue())
                .createdAt(session.getCreatedAt())
                .build();
    }

    @Transactional
    public SessionResponse bookSession(SessionRequest request) {

        // 1. Fetch the Learner (From JWT, NOT from the request body!)
        User learner = getAuthenticatedUser();

        // 2. Fetch the Skill
        Skill skill = skillRepository.findById(request.getSkillId())
                .orElseThrow(() -> new IllegalArgumentException("Skill not found"));

        // 3. Fetch the Availability (This gives us the Mentor ID and the Times!)
        Availability availability = availabilityRepository.findById(request.getAvailabilityId())
                .orElseThrow(() -> new IllegalArgumentException("Time slot not found"));
                
        // Fetch the full Mentor user to avoid lazy initialization proxy errors later
        User mentor = userRepository.findById(availability.getUser().getId())
                .orElseThrow(() -> new IllegalArgumentException("Mentor not found"));

        // 4. Validation Rule: Is it already booked?
        if (availability.getIsBooked()) {
            throw new IllegalStateException("Sorry, this time slot is already booked!");
        }

        // 5. Validation Rule: You cannot book yourself!
        if (availability.getUser().getId().equals(learner.getId())) {
            throw new IllegalArgumentException("You cannot book your own time slot!");
        }

        // CREDIT GUARD RAIL: Enforce minimum credit balance before booking
        int sessionCost = 10;
        int updatedRows = userRepository.deductCreditsIfSufficient(learner.getId(), sessionCost);
        if (updatedRows != 1) {
            throw new IllegalStateException("You do not have enough credits to book this session! You need " + sessionCost + " credits.");
        }

        // Build the Session Entity
        Session session = new Session();
        session.setLearner(learner);
        session.setMentor(mentor);
        session.setSkill(skill);
        session.setStartTime(availability.getStartTime());
        session.setEndTime(availability.getEndTime());
        session.setAvailabilityId(availability.getId());
        session.setStatus(SessionStatus.PENDING);

        // CRITICAL FIX: Map to DTO *inside* the @Transactional boundary.
        // This resolves all lazy proxies (Session -> Skill, -> User) before the
        // Hibernate session closes, preventing "no session" serialization crashes.
        Session saved = sessionRepository.save(session);

        // 7. Atomically reserve the Availability to show it is now taken
        int reservedRows =
                availabilityRepository.reserveAvailabilityAtomically(
                        availability.getId(),
                        saved.getId()
                );

        if (reservedRows != 1) {
            throw new IllegalStateException(
                    "Sorry, this time slot is already booked!"
            );
        }

        // 8. Notification
        notificationService.sendNotification(
                availability.getUser(),
                "New session request! Someone wants to learn from you.",
                NotificationType.SESSION_UPDATE
        );

        return toDto(saved);
    }

    @Transactional
    public SessionResponse updateSessionStatus(UUID sessionId, SessionStatus newStatus) {

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        User authenticatedMentor = getAuthenticatedUser();

        // SECURITY GUARD: Only the mentor assigned to this session can accept/reject it
        if (!session.getMentor().getId().equals(authenticatedMentor.getId())) {
            throw new IllegalStateException("Security Violation: Only the assigned mentor can update this session!");
        }

        if (newStatus != SessionStatus.ACCEPTED && newStatus != SessionStatus.REJECTED) {
            throw new IllegalArgumentException("Invalid target status");
        }

        if (newStatus == SessionStatus.ACCEPTED) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime timeoutThreshold = now.minusHours(responseTimeoutHours);
            if (!now.isBefore(session.getStartTime()) ||
                (session.getCreatedAt() != null && !timeoutThreshold.isBefore(session.getCreatedAt()))) {
                throw new IllegalStateException("Session request has expired and cannot be accepted.");
            }
        }

        int updated = sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                newStatus,
                List.of(SessionStatus.PENDING)
        );

        if (updated == 0) {
            throw new IllegalStateException("Session is not in PENDING state or was already processed.");
        }

        session.setStatus(newStatus);

        if (newStatus == SessionStatus.ACCEPTED) {
            notificationService.sendNotification(
                    session.getLearner(),
                    "Great news! Your session with " + session.getMentor().getFullName() + " was ACCEPTED. Credits are locked in Escrow.",
                    NotificationType.SESSION_UPDATE
            );
        } else if (newStatus == SessionStatus.REJECTED) {
            userRepository.addCreditsAtomically(session.getLearner().getId(), 10);

            if (session.getAvailabilityId() != null) {
                int released = availabilityRepository.releaseAvailabilityAtomically(session.getAvailabilityId(), session.getId());
                if (released != 1) {
                    throw new IllegalStateException("Failed to release availability: ownership mismatch or already released");
                }
            }

            notificationService.sendNotification(
                    session.getLearner(),
                    "Your session request to " + session.getMentor().getFullName() + " was declined. Your credits have been refunded.",
                    NotificationType.SESSION_UPDATE
            );
        }

        Session saved = sessionRepository.save(session);
        return toDto(saved);
    }

    // ---------------------------------------------------------
    // THE CANCELLATION ENGINE
    // ---------------------------------------------------------
    @Transactional
    public SessionResponse cancelSession(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (session.getStatus() != SessionStatus.ACCEPTED && session.getStatus() != SessionStatus.PENDING) {
            throw new IllegalStateException("You can only cancel upcoming sessions!");
        }

        if (session.getStatus() == SessionStatus.ACCEPTED) {
            if (session.getStartTime() == null || !LocalDateTime.now().isBefore(session.getStartTime())) {
                throw new IllegalStateException("Cannot cancel an ACCEPTED session after its scheduled start time.");
            }
        }

        int updated = sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.CANCELLED,
                List.of(session.getStatus())
        );

        if (updated == 0) {
            throw new IllegalStateException("Session was already cancelled or processed.");
        }

        // SECURITY GUARD: Fetch canceling user from JWT
        User cancelingUser = getAuthenticatedUser();
        User learner = session.getLearner();
        User mentor = session.getMentor();

        int originalCost = 10;
        int penaltyAmount = 5;

        if (cancelingUser.getId().equals(learner.getId())) {
            // Learner Cancels Logic
            if (session.getStatus() == SessionStatus.PENDING) {
                userRepository.addCreditsAtomically(learner.getId(), originalCost);
                notificationService.sendNotification(mentor, "The learner cancelled their session request.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(learner, "You cancelled your session request. You were refunded your full 10 credits.", NotificationType.SESSION_UPDATE);
            } else {
                userRepository.addCreditsAtomically(learner.getId(), originalCost - penaltyAmount);
                userRepository.addCreditsAtomically(mentor.getId(), penaltyAmount);
                notificationService.sendNotification(mentor, "The learner cancelled the session. You received " + penaltyAmount + " credits as compensation.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(learner, "You cancelled the session. You were refunded 5 credits (Penalty applied).", NotificationType.SESSION_UPDATE);
            }

        } else if (cancelingUser.getId().equals(mentor.getId())) {
            // Mentor Cancels Logic
            if (session.getStatus() == SessionStatus.PENDING) {
                userRepository.addCreditsAtomically(learner.getId(), originalCost);
                notificationService.sendNotification(learner, "The mentor cancelled the session request. You received a full refund.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(mentor, "You cancelled the pending session request. No penalty was applied.", NotificationType.SESSION_UPDATE);
            } else {
                userRepository.addCreditsAtomically(learner.getId(), originalCost + penaltyAmount);
                userRepository.addCreditsAtomically(mentor.getId(), -penaltyAmount);
                notificationService.sendNotification(learner, "The mentor cancelled the session. You received a full refund PLUS " + penaltyAmount + " credits compensation.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(mentor, "You cancelled the session. A penalty of " + penaltyAmount + " credits was applied.", NotificationType.SESSION_UPDATE);
            }

        } else {
            throw new IllegalArgumentException("Security Violation: You are not part of this session!");
        }

        // userRepository.save(learner);
        // userRepository.save(mentor);

        if (session.getAvailabilityId() != null) {
            int released = availabilityRepository.releaseAvailabilityAtomically(session.getAvailabilityId(), session.getId());
            if (released != 1) {
                throw new IllegalStateException("Failed to release availability: ownership mismatch or already released");
            }
        }

        session.setStatus(SessionStatus.CANCELLED);
        Session saved = sessionRepository.save(session);
        return toDto(saved);
    }

    @Transactional
    public SessionResponse completeSession(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (session.getStatus() != SessionStatus.ACCEPTED) {
            throw new IllegalStateException("Only ACCEPTED sessions can be marked as COMPLETED!");
        }

        if (LocalDateTime.now().isBefore(session.getEndTime())) {
            throw new IllegalStateException("Cannot complete session before its end time.");
        }

        // SECURITY GUARD: Only the learner can mark it complete
        User authenticatedUser = getAuthenticatedUser();
        if (!session.getLearner().getId().equals(authenticatedUser.getId())) {
            throw new IllegalStateException("Security Violation: Only the Learner can complete the session!");
        }

        int updated = sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.COMPLETED,
                List.of(SessionStatus.ACCEPTED)
        );

        if (updated == 0) {
            throw new IllegalStateException("Session is not in ACCEPTED state or was already completed.");
        }

        User mentor = session.getMentor();
        User learner = session.getLearner();

        notificationService.sendNotification(mentor, "Your session with " + learner.getFullName() + " is completed.", NotificationType.MESSAGE);
        notificationService.sendNotification(learner, "Your session with " + mentor.getFullName() + " is completed.", NotificationType.MESSAGE);

        gamificationService.awardSessionCompletionXp(session.getMentor());
        gamificationService.awardSessionCompletionXp(session.getLearner());

        userRepository.addCreditsAtomically(mentor.getId(), 10);
        session.setStatus(SessionStatus.COMPLETED);

        Session saved = sessionRepository.save(session);
        return toDto(saved);
    }

    @Transactional
    public List<SessionResponse> getLearnerSessions(UUID learnerId) {
        // SECURITY GUARD: You can only view your own history
        if (!getAuthenticatedUser().getId().equals(learnerId)) {
            throw new IllegalStateException("Security Violation: You can only view your own classes!");
        }
        // CRITICAL FIX: Map to DTO inside @Transactional so lazy proxies are resolved
        // before the Hibernate session closes.
        return sessionRepository.findByLearnerId(learnerId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public List<SessionResponse> getMentorSessions(UUID mentorId) {
        if (!getAuthenticatedUser().getId().equals(mentorId)) {
            throw new IllegalStateException("Security Violation: You can only view your own schedule!");
        }
        // CRITICAL FIX: Map to DTO inside @Transactional so lazy proxies are resolved
        // before the Hibernate session closes.
        return sessionRepository.findByMentorId(mentorId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public int expireOverdueSessions() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime timeoutThreshold = now.minusHours(responseTimeoutHours);

        List<Session> expiredPending = sessionRepository.findPendingSessionsForExpiration(
                SessionStatus.PENDING, now, timeoutThreshold);

        int successfulCount = 0;

        for (Session session : expiredPending) {
            try {
                boolean processed = sessionExpirationProcessor.processPendingExpiration(session.getId());
                if (processed) {
                    successfulCount++;
                }
            } catch (Exception e) {
                log.error("Failed to process expiration for session ID: {}", session.getId(), e);
            }
        }

        List<Session> forgottenAccepted = sessionRepository.findByStatusInAndEndTimeBefore(
                Arrays.asList(SessionStatus.ACCEPTED), now);

        for (Session session : forgottenAccepted) {
            try {
                boolean processed = sessionExpirationProcessor.processAcceptedCompletion(session.getId());
                if (processed) {
                    successfulCount++;
                }
            } catch (Exception e) {
                log.error("Failed to process accepted completion for session ID: {}", session.getId(), e);
            }
        }

        return successfulCount;
    }

    @Transactional
    public SessionResponse addMeetingLink(UUID sessionId, String meetingLink) {
        User currentUser = getAuthenticatedUser(); // Grabs the logged-in user from JWT

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found!"));

        // 1. Security Check: Only the assigned Mentor can add the link
        if (!session.getMentor().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Access Denied: Only the assigned mentor can add a meeting link.");
        }

        // 2. State Check: Don't let them add links to Cancel or Completed sessions
        if (session.getStatus().name().equals("CANCELLED") || session.getStatus().name().equals("COMPLETED")) {
            throw new IllegalStateException("Cannot add a meeting link to a closed session.");
        }

        // 3. Update the link
        session.setMeetingLink(meetingLink);
        Session saved = sessionRepository.save(session);

        // 4. Fire the Notification to the Learner!
        String message = "Your mentor, " + currentUser.getFullName() + ", has posted the meeting link for your upcoming session!";
        notificationService.sendNotification(session.getLearner(), message, NotificationType.SESSION_UPDATE);

        return toDto(saved);
    }
}