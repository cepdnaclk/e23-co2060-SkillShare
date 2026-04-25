package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.SessionRequest;
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

    // --- THE SECURITY ENGINE ---
    // LOGIC: This helper method grabs the exact user currently making the API request
    // directly from the validated JWT token. No spoofing allowed!
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));
    }

    @Transactional
    public Session bookSession(SessionRequest request) {

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

        // Logic: The Upfront Payment (Escrow)
        int sessionCost = 10;
        if (learner.getCredits() < sessionCost) {
            throw new IllegalStateException("You do not have enough credits to book this session!");
        }

        // Deduct the money immediately so they cannot double-spend it
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

        return sessionRepository.save(session);
    }

    @Transactional
    public Session updateSessionStatus(UUID sessionId, SessionStatus newStatus) {

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

        return sessionRepository.save(session);
    }

    // ---------------------------------------------------------
    // THE CANCELLATION ENGINE
    // ---------------------------------------------------------
    @Transactional
    public Session cancelSession(UUID sessionId) {
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
        return sessionRepository.save(session);
    }

    @Transactional
    public Session completeSession(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (session.getStatus() != SessionStatus.ACCEPTED) {
            throw new IllegalStateException("Only ACCEPTED sessions can be marked as COMPLETED!");
        }

        // SECURITY GUARD: Only the mentor can mark it complete
        User authenticatedUser = getAuthenticatedUser();
        if (!session.getMentor().getId().equals(authenticatedUser.getId())) {
            throw new IllegalStateException("Security Violation: Only the Mentor can complete the session!");
        }

        User mentor = session.getMentor();
        mentor.setCredits(mentor.getCredits() + 10);
        session.setStatus(SessionStatus.COMPLETED);

        userRepository.save(mentor);
        return sessionRepository.save(session);
    }

    public List<Session> getLearnerSessions(UUID learnerId) {
        // SECURITY GUARD: You can only view your own history
        if (!getAuthenticatedUser().getId().equals(learnerId)) {
            throw new IllegalStateException("Security Violation: You can only view your own classes!");
        }
        return sessionRepository.findByLearnerId(learnerId);
    }

    public List<Session> getMentorSessions(UUID mentorId) {
        if (!getAuthenticatedUser().getId().equals(mentorId)) {
            throw new IllegalStateException("Security Violation: You can only view your own schedule!");
        }
        return sessionRepository.findByMentorId(mentorId);
    }

    @Transactional
    public int expireOverdueSessions() {
        LocalDateTime now = LocalDateTime.now();
        List<SessionStatus> targetStatuses = Arrays.asList(SessionStatus.PENDING, SessionStatus.ACCEPTED);
        List<Session> overdueSessions = sessionRepository.findByStatusInAndEndTimeBefore(targetStatuses, now);

        for (Session session : overdueSessions) {
            User learner = session.getLearner();
            learner.setCredits(learner.getCredits() + 10);
            userRepository.save(learner);

            session.setStatus(SessionStatus.EXPIRED);
            sessionRepository.save(session);

            notificationService.sendNotification(learner, "Your session expired. Your 10 credits have been refunded.", NotificationType.SYSTEM_ALERT);
            notificationService.sendNotification(session.getMentor(), "The session expired. No credits were awarded.", NotificationType.SYSTEM_ALERT);
        }
        return overdueSessions.size();
    }
}