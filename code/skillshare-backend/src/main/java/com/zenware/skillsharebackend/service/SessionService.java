package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class SessionService {

    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SkillRepository skillRepository;
    @Autowired private AvailabilityRepository availabilityRepository;
    @Autowired private NotificationService notificationService;

    @Transactional
    public Session bookSession(SessionRequest request) {

        // 1. Fetch the Learner
        User learner = userRepository.findById(request.getLearnerId())
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

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

        // LOGIC EXPLANATION: Explicitly set the initial state using the Enum!
        session.setStatus(SessionStatus.PENDING);

        // 7. Update the Availability to show it is now taken
        availability.setIsBooked(true);
        availabilityRepository.save(availability);

        // --- NOTIFICATION TRIGGER: Step 2 ---
        notificationService.sendNotification(
                availability.getUser(),
                "New session request! Someone wants to learn from you.",
                NotificationType.SESSION_UPDATE
        );

        // 8. Save the final Session
        return sessionRepository.save(session);
    }

    @Transactional
    public Session updateSessionStatus(UUID sessionId, UUID mentorId, SessionStatus newStatus) {

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!session.getMentor().getId().equals(mentorId)) {
            throw new IllegalStateException("Only the assigned mentor can update this session!");
        }

        // LOGIC EXPLANATION: We just assign the Enum directly.
        session.setStatus(newStatus);

        // LOGIC EXPLANATION: Using the '==' operator because Enums are memory-safe singletons.
        if (newStatus == SessionStatus.ACCEPTED) {
            // --- NOTIFICATION TRIGGER: Step 3 ---
            notificationService.sendNotification(
                    session.getLearner(),
                    "Great news! Your session with " + session.getMentor().getFullName() + " was ACCEPTED. Credits are locked in Escrow.",
                    NotificationType.SESSION_UPDATE
            );
        } else if (newStatus == SessionStatus.REJECTED) {
            Availability availability = availabilityRepository.findByUserIdAndStartTime(
                    mentorId, session.getStartTime()
            ).orElseThrow(() -> new IllegalStateException("Original time slot missing"));

            User learner = session.getLearner();
            learner.setCredits(learner.getCredits() + 10);
            userRepository.save(learner);

            availability.setIsBooked(false);
            availabilityRepository.save(availability);

            // --- NOTIFICATION TRIGGER: Step 4 ---
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
    public Session cancelSession(UUID sessionId, UUID cancelingUserId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (session.getStatus() != SessionStatus.ACCEPTED && session.getStatus() != SessionStatus.PENDING) {
            throw new IllegalStateException("You can only cancel upcoming sessions!");
        }

        User learner = session.getLearner();
        User mentor = session.getMentor();
        int originalCost = 10;
        int penaltyAmount = 5;

        if (cancelingUserId.equals(learner.getId())) {

            if (session.getStatus() == SessionStatus.PENDING) {
                // LOGIC: Learner cancels a PENDING request. Full refund, no mentor compensation.
                learner.setCredits(learner.getCredits() + originalCost);

                notificationService.sendNotification(mentor, "The learner cancelled their session request.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(learner, "You cancelled your session request. You were refunded your full 10 credits.", NotificationType.SESSION_UPDATE);
            } else {
                // LOGIC: Learner Cancels an ACCEPTED session. They get halfback, Mentor gets half as compensation.
                learner.setCredits(learner.getCredits() + (originalCost - penaltyAmount));
                mentor.setCredits(mentor.getCredits() + penaltyAmount);

                notificationService.sendNotification(mentor, "The learner cancelled the session. You received " + penaltyAmount + " credits as compensation.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(learner, "You cancelled the session. You were refunded 5 credits (Penalty applied). Please leave cancellation feedback.", NotificationType.SESSION_UPDATE);
            }

        } else if (cancelingUserId.equals(mentor.getId())) {

            if (session.getStatus() == SessionStatus.PENDING) {
                // LOGIC: Mentor cancels a PENDING request. Learner gets full refund, no penalty to Mentor.
                learner.setCredits(learner.getCredits() + originalCost);

                notificationService.sendNotification(learner, "The mentor cancelled the session request. You received a full refund.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(mentor, "You cancelled the pending session request. No penalty was applied.", NotificationType.SESSION_UPDATE);
            } else {
                // LOGIC: Mentor Cancels an ACCEPTED session. Learner gets full refund + 5 from Mentor's pocket.
                learner.setCredits(learner.getCredits() + originalCost + penaltyAmount);
                mentor.setCredits(mentor.getCredits() - penaltyAmount);

                notificationService.sendNotification(learner, "The mentor cancelled the session. You received a full refund PLUS " + penaltyAmount + " credits compensation. Please leave feedback.", NotificationType.SESSION_UPDATE);
                notificationService.sendNotification(mentor, "You cancelled the session. A penalty of " + penaltyAmount + " credits was applied.", NotificationType.SESSION_UPDATE);
            }

        } else {
            throw new IllegalArgumentException("User is not part of this session!");
        }

        userRepository.save(learner);
        userRepository.save(mentor);

        // Free up the time slot again!
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

        // LOGIC EXPLANATION: Checking the state machine rules strictly using the Enum.
        if (session.getStatus() != SessionStatus.ACCEPTED) {
            throw new IllegalStateException("Only ACCEPTED sessions can be marked as COMPLETED!");
        }

        User mentor = session.getMentor();
        mentor.setCredits(mentor.getCredits() + 10);

        // LOGIC EXPLANATION: Moving the state forward safely.
        session.setStatus(SessionStatus.COMPLETED);

        userRepository.save(mentor);
        return sessionRepository.save(session);
    }

    public List<Session> getLearnerSessions(UUID learnerId) {
        return sessionRepository.findByLearnerId(learnerId);
    }

    public List<Session> getMentorSessions(UUID mentorId) {
        return sessionRepository.findByMentorId(mentorId);
    }

    // ---------------------------------------------------------
    // THE EXPIRATION ENGINE
    // ---------------------------------------------------------
    @Transactional
    public int expireOverdueSessions() {
        LocalDateTime now = LocalDateTime.now();

        List<SessionStatus> targetStatuses = Arrays.asList(SessionStatus.PENDING, SessionStatus.ACCEPTED);

        // LOGIC: This leverages the custom query we just added to the SessionRepository!
        List<Session> overdueSessions = sessionRepository.findByStatusInAndEndTimeBefore(targetStatuses, now);

        for (Session session : overdueSessions) {
            User learner = session.getLearner();

            learner.setCredits(learner.getCredits() + 10);
            userRepository.save(learner);

            session.setStatus(SessionStatus.EXPIRED);
            sessionRepository.save(session);

            notificationService.sendNotification(
                    learner,
                    "Your session with " + session.getMentor().getFullName() + " expired without completion. Your 10 credits have been refunded.",
                    NotificationType.SYSTEM_ALERT
            );

            notificationService.sendNotification(
                    session.getMentor(),
                    "The session with " + learner.getFullName() + " expired. No credits were awarded.",
                    NotificationType.SYSTEM_ALERT
            );
        }

        return overdueSessions.size();
    }
}