package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.dto.SessionResponse;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor // LOGIC: Switched to Constructor Injection for modern Spring Boot!
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final AvailabilityRepository availabilityRepository;
    private final NotificationService notificationService;
    private final GamificationService gamificationService;

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

        // 3. Fetch the Availability (This gives us the Mentor and the Times!)
        Availability availability = availabilityRepository.findById(request.getAvailabilityId())
                .orElseThrow(() -> new IllegalArgumentException("Time slot not found"));

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
        if (learner.getCredits() == null || learner.getCredits() < sessionCost) {
            throw new IllegalStateException("You do not have enough credits to book this session! You need " + sessionCost + " credits.");
        }

        // ESCROW: Deduct credits immediately so they cannot double-spend
        learner.setCredits(learner.getCredits() - sessionCost);
        userRepository.save(learner);

        // 6. Build the Session
        Session session = new Session();
        session.setLearner(learner);
        session.setMentor(availability.getUser());
        session.setSkill(skill);
        session.setStartTime(availability.getStartTime());
        session.setEndTime(availability.getEndTime());
        session.setStatus(SessionStatus.PENDING);

        // 7. Update the Availability to show it is now taken
        availability.setIsBooked(true);
        availabilityRepository.save(availability);

        // 8. Notification
        notificationService.sendNotification(
                availability.getUser(),
                "New session request! Someone wants to learn from you.",
                NotificationType.SESSION_UPDATE
        );

        // CRITICAL FIX: Map to DTO *inside* the @Transactional boundary.
        // This resolves all lazy proxies (Session -> Skill, -> User) before the
        // Hibernate session closes, preventing "no session" serialization crashes.
        Session saved = sessionRepository.save(session);
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

        session.setStatus(newStatus);

        if (newStatus == SessionStatus.ACCEPTED) {
            notificationService.sendNotification(
                    session.getLearner(),
                    "Great news! Your session with " + session.getMentor().getFullName() + " was ACCEPTED. Credits are locked in Escrow.",
                    NotificationType.SESSION_UPDATE
            );
        } else if (newStatus == SessionStatus.REJECTED) {
            Availability availability = availabilityRepository.findByUserIdAndStartTime(
                    authenticatedMentor.getId(), session.getStartTime()
            ).orElseThrow(() -> new IllegalStateException("Original time slot missing"));

            User learner = session.getLearner();
            learner.setCredits(learner.getCredits() + 10);
            userRepository.save(learner);

            availability.setIsBooked(false);
            availabilityRepository.save(availability);

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

        // SECURITY GUARD: Fetch canceling user from JWT
        User cancelingUser = getAuthenticatedUser();
        User learner = session.getLearner();
        User mentor = session.getMentor();

        int originalCost = 10;
        int penaltyAmount = 5;

        if (cancelingUser.getId().equals(learner.getId())) {
            // Learner Cancels Logic
            if (session.getStatus() == SessionStatus.PENDING) {
                learner.setCredits(learner.getCredits() + originalCost);
                notificationService.sendNotification(mentor, "The learner cancelled their session request.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(learner, "You cancelled your session request. You were refunded your full 10 credits.", NotificationType.SESSION_UPDATE);
            } else {
                learner.setCredits(learner.getCredits() + (originalCost - penaltyAmount));
                mentor.setCredits(mentor.getCredits() + penaltyAmount);
                notificationService.sendNotification(mentor, "The learner cancelled the session. You received " + penaltyAmount + " credits as compensation.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(learner, "You cancelled the session. You were refunded 5 credits (Penalty applied).", NotificationType.SESSION_UPDATE);
            }

        } else if (cancelingUser.getId().equals(mentor.getId())) {
            // Mentor Cancels Logic
            if (session.getStatus() == SessionStatus.PENDING) {
                learner.setCredits(learner.getCredits() + originalCost);
                notificationService.sendNotification(learner, "The mentor cancelled the session request. You received a full refund.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(mentor, "You cancelled the pending session request. No penalty was applied.", NotificationType.SESSION_UPDATE);
            } else {
                learner.setCredits(learner.getCredits() + originalCost + penaltyAmount);
                mentor.setCredits(mentor.getCredits() - penaltyAmount);
                notificationService.sendNotification(learner, "The mentor cancelled the session. You received a full refund PLUS " + penaltyAmount + " credits compensation.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(mentor, "You cancelled the session. A penalty of " + penaltyAmount + " credits was applied.", NotificationType.SESSION_UPDATE);
            }

        } else {
            throw new IllegalArgumentException("Security Violation: You are not part of this session!");
        }

        userRepository.save(learner);
        userRepository.save(mentor);

        Availability availability = availabilityRepository.findByUserIdAndStartTime(mentor.getId(), session.getStartTime())
                .orElseThrow(() -> new IllegalStateException("Original time slot missing"));
        availability.setIsBooked(false);
        availabilityRepository.save(availability);

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

        // SECURITY GUARD: Only the learner can mark it complete
        User authenticatedUser = getAuthenticatedUser();
        if (!session.getLearner().getId().equals(authenticatedUser.getId())) {
            throw new IllegalStateException("Security Violation: Only the Learner can complete the session!");
        }

        User mentor = session.getMentor();
        User learner = session.getLearner();

        notificationService.sendNotification(mentor, "Your session with " + learner.getFullName() + " is completed.", NotificationType.MESSAGE);
        notificationService.sendNotification(learner, "Your session with " + mentor.getFullName() + " is completed.", NotificationType.MESSAGE);

        gamificationService.awardSessionCompletionXp(session.getMentor());
        gamificationService.awardSessionCompletionXp(session.getLearner());

        mentor.setCredits(mentor.getCredits() + 10);
        session.setStatus(SessionStatus.COMPLETED);

        userRepository.save(mentor);
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

    @Transactional
    public int expireOverdueSessions() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Handle Expired PENDING Sessions (Refund the Learner)
        List<Session> expiredPending = sessionRepository.findByStatusInAndEndTimeBefore(
                Arrays.asList(SessionStatus.PENDING), now);

        for (Session session : expiredPending) {
            User learner = session.getLearner();
            learner.setCredits(learner.getCredits() + 10);
            userRepository.save(learner);

            session.setStatus(SessionStatus.EXPIRED);
            sessionRepository.save(session);

            notificationService.sendNotification(learner, "Your session request expired. Your 10 credits have been refunded.", NotificationType.SYSTEM_ALERT);
        }

        // 2. Handle Forgotten ACCEPTED Sessions (Auto-Pay the Mentor)
        List<Session> forgottenAccepted = sessionRepository.findByStatusInAndEndTimeBefore(
                Arrays.asList(SessionStatus.ACCEPTED), now);

        for (Session session : forgottenAccepted) {
            User mentor = session.getMentor();
            // The learner forgot to click complete, so we auto-release the escrow to the mentor
            mentor.setCredits(mentor.getCredits() + 10);
            userRepository.save(mentor);

            session.setStatus(SessionStatus.COMPLETED); // Auto-completed!
            sessionRepository.save(session);

            notificationService.sendNotification(mentor, "The session time passed and was auto-completed. You received 10 credits.", NotificationType.SYSTEM_ALERT);
        }

        return expiredPending.size() + forgottenAccepted.size();
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