package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.FeedbackRequest;
import com.zenware.skillsharebackend.dto.FeedbackTagDto;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.FeedbackRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    @Autowired private FeedbackRepository feedbackRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;

    // 1. INJECT THE NOTIFICATION SERVICE HERE
    @Autowired private NotificationService notificationService;

    @Transactional
    public Feedback leaveFeedback(FeedbackRequest request) {

        // 1. Fetch Session
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // 2. STATUS GUARD RAIL
        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new RuntimeException("You can only leave feedback for COMPLETED sessions!");
        }

        // 3. SECURITY GUARD RAIL
        UUID trueLearnerId = session.getLearner().getId();
        UUID trueMentorId = session.getMentor().getId();
        UUID incomingGiver = request.getGiverId();
        UUID incomingReceiver = request.getReceiverId();

        boolean isLearnerToMentor = incomingGiver.equals(trueLearnerId) && incomingReceiver.equals(trueMentorId);
        boolean isMentorToLearner = incomingGiver.equals(trueMentorId) && incomingReceiver.equals(trueLearnerId);

        if (!isLearnerToMentor && !isMentorToLearner) {
            throw new RuntimeException("Security Violation: Giver and Receiver do not match this session's participants!");
        }

        // 4. DUPLICATE GUARD RAIL
        if (feedbackRepository.existsBySessionIdAndGiverId(request.getSessionId(), request.getGiverId())) {
            throw new RuntimeException("You have already left feedback for this session!");
        }

        // 5. THE SUMMATION LOGIC
        int totalReputationChange = 0;
        for (String tagString : request.getSelectedTags()) {
            try {
                FeedbackTag tag = FeedbackTag.valueOf(tagString.toUpperCase());
                totalReputationChange += tag.getWeight();
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid feedback tag selected: " + tagString);
            }
        }

        // 6. Update the Receiver's Score
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        receiver.setReputationScore(receiver.getReputationScore() + totalReputationChange);
        userRepository.save(receiver);

        // 7. Save the Feedback Entity
        Feedback feedback = new Feedback();
        feedback.setSession(session);

        User giverProxy = userRepository.getReferenceById(request.getGiverId());
        feedback.setGiver(giverProxy);
        feedback.setReceiver(receiver);
        feedback.setFeedbackTag(String.join(", ", request.getSelectedTags()));
        feedback.setWeight(totalReputationChange);

        Feedback savedFeedback = feedbackRepository.save(feedback);

        // ---------------------------------------------------------
        // NOTIFICATION TRIGGER 1: Tell the receiver they got rated!
        // ---------------------------------------------------------
        String sign = totalReputationChange >= 0 ? "+" : "";
        notificationService.sendNotification(
                receiver,
                "You received new feedback! Reputation changed by " + sign + totalReputationChange,
                NotificationType.FEEDBACK_RECEIVED
        );

        // 8. THE FEEDBACK LOOP CLOSURE ENGINE
        long totalFeedbacks = feedbackRepository.countBySessionId(session.getId());

        if (totalFeedbacks == 2) {
            session.setStatus(SessionStatus.CLOSED);
            sessionRepository.save(session);

            // ---------------------------------------------------------
            // NOTIFICATION TRIGGER 2: Tell both parties it's officially over
            // ---------------------------------------------------------
            notificationService.sendNotification(session.getLearner(), "Your session is fully closed. Thank you for leaving feedback!", NotificationType.SYSTEM_ALERT);
            notificationService.sendNotification(session.getMentor(), "Your session is fully closed. Thank you for leaving feedback!", NotificationType.SYSTEM_ALERT);
        }

        return savedFeedback;
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