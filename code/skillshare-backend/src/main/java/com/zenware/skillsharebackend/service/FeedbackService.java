package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.FeedbackRequest;
import com.zenware.skillsharebackend.dto.FeedbackResponse;
import com.zenware.skillsharebackend.dto.FeedbackTagDto;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.FeedbackRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // LOGIC: Modern Constructor Injection!
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // --- NEW: INJECT THE GAMIFICATION ENGINE ---
    private final GamificationService gamificationService;

    // --- THE SECURITY ENGINE ---
    // LOGIC: Extracts the exact user making the request from the JWT Token.
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));
    }

    @Transactional
    public FeedbackResponse leaveFeedback(FeedbackRequest request) {

        // 1. Fetch Session
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // 2. STATUS GUARD RAIL
        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new IllegalStateException("You can only leave feedback for COMPLETED sessions!");
        }

        // 3. ZERO-TRUST SECURITY GUARD RAIL
        // LOGIC: We dynamically deduce the Giver and Receiver. No spoofing allowed!
        User giver = getAuthenticatedUser();
        User receiver;

        if (giver.getId().equals(session.getLearner().getId())) {
            receiver = session.getMentor(); // Learner is reviewing Mentor
        } else if (giver.getId().equals(session.getMentor().getId())) {
            receiver = session.getLearner(); // Mentor is reviewing Learner
        } else {
            throw new IllegalArgumentException("Security Violation: You were not a participant in this session!");
        }

        // 4. DUPLICATE GUARD RAIL
        if (feedbackRepository.existsBySessionIdAndGiverId(request.getSessionId(), giver.getId())) {
            throw new IllegalStateException("You have already left feedback for this session!");
        }

        // 5. THE SUMMATION LOGIC
        int totalReputationChange = 0;
        for (String tagString : request.getSelectedTags()) {
            try {
                FeedbackTag tag = FeedbackTag.valueOf(tagString.toUpperCase());
                totalReputationChange += tag.getWeight();
            } catch (IllegalArgumentException e) {
                // Caught by your GlobalExceptionHandler as a 400 Bad Request
                throw new IllegalArgumentException("Invalid feedback tag selected: " + tagString);
            }
        }

        // 6. Update the Receiver's Score
        receiver.setReputationScore(receiver.getReputationScore() + totalReputationChange);
        userRepository.save(receiver);

        // --- NEW: GAMIFICATION TRIGGER ---
        // LOGIC: If the overall feedback is positive, treat it as our "5-Star Rating" equivalent
        if (totalReputationChange > 0) {
            gamificationService.awardFiveStarRatingXp(receiver);
        }

        // 7. Save the Feedback Entity (Using the new Builder pattern)
        Feedback feedback = Feedback.builder()
                .session(session)
                .giver(giver)
                .receiver(receiver)
                .feedbackTag(String.join(", ", request.getSelectedTags()))
                .weight(totalReputationChange)
                .build();

        Feedback savedFeedback = feedbackRepository.save(feedback);

        // ---------------------------------------------------------
        // NOTIFICATION TRIGGER 1: Tell the receiver they got rated!
        // ---------------------------------------------------------
        String sign = totalReputationChange >= 0 ? "+" : "";
        notificationService.sendNotification(
                receiver,
                "You received new feedback! Reputation changed by " + sign + totalReputationChange,
                NotificationType.SYSTEM_ALERT // Fallback to SYSTEM_ALERT to match our Enum
        );

        // 8. THE FEEDBACK LOOP CLOSURE ENGINE
        long totalFeedbacks = feedbackRepository.countBySessionId(session.getId());

        // LOGIC: Once both the Learner and Mentor leave feedback, the session is officially CLOSED.
        if (totalFeedbacks == 2) {
            session.setStatus(SessionStatus.CLOSED);
            sessionRepository.save(session);

            // ---------------------------------------------------------
            // NOTIFICATION TRIGGER 2: Tell both parties it's officially over
            // ---------------------------------------------------------
            notificationService.sendNotification(session.getLearner(), "Your session is fully closed. Thank you for leaving feedback!", NotificationType.SYSTEM_ALERT);
            notificationService.sendNotification(session.getMentor(), "Your session is fully closed. Thank you for leaving feedback!", NotificationType.SYSTEM_ALERT);
        }

        // CRITICAL FIX: Map to DTO *inside* the @Transactional boundary.
        // The Hibernate session is still open here, so all lazy proxies
        // (Feedback -> Session -> Skill) are safely accessible.
        // If we returned the raw Feedback entity, Jackson would try to
        // serialize the lazy Skill proxy AFTER the transaction closes -> "no session" crash.
        return FeedbackResponse.builder()
                .id(savedFeedback.getId())
                .sessionId(session.getId())
                .giverId(giver.getId())
                .giverName(giver.getFullName())
                .receiverId(receiver.getId())
                .receiverName(receiver.getFullName())
                .feedbackTag(savedFeedback.getFeedbackTag())
                .weight(savedFeedback.getWeight())
                .createdAt(savedFeedback.getCreatedAt())
                .build();
    }

    public List<Feedback> getUserFeedback(UUID userId) {
        return feedbackRepository.findByReceiverId(userId);
    }

    public List<FeedbackTagDto> getAllAvailableTags() {
        return Arrays.stream(FeedbackTag.values())
                .map(tag -> new FeedbackTagDto(
                        tag.name(),
                        tag.getWeight(),
                        tag.getWeight() > 0 ? "POSITIVE" : "NEGATIVE"
                ))
                .collect(Collectors.toList());
    }
}