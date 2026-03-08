package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.FeedbackRequest;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.FeedbackRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * LOGIC: @Transactional ensures that if the server crashes halfway through,
     * it rolls back the changes. The user doesn't get a reputation boost unless
     * the feedback is successfully saved to the database.
     */
    @Transactional
    public Feedback leaveFeedback(FeedbackRequest request) {

        // 1. Fetch Session
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // 2. STATUS GUARD RAIL
        // LOGIC: Using a case-insensitive String check since we don't have a SessionStatus Enum.
        if (session.getStatus() == SessionStatus.COMPLETED) {
            throw new RuntimeException("You can only leave feedback for COMPLETED sessions!");
        }

        // 3. DUPLICATE GUARD RAIL
        // LOGIC: Prevents spamming. 1 Session = 1 Review.
        if (feedbackRepository.existsBySessionIdAndGiverId(request.getSessionId(), request.getGiverId())) {
            throw new RuntimeException("You have already left feedback for this session!");
        }

        // 4. THE SUMMATION LOGIC (Looping through selected tags)
        int totalReputationChange = 0;

        for (String tagString : request.getSelectedTags()) {
            try {
                // Convert the String to our Enum, then add its secret weight
                FeedbackTag tag = FeedbackTag.valueOf(tagString.toUpperCase());
                totalReputationChange += tag.getWeight();
            } catch (IllegalArgumentException e) {
                // LOGIC: If a hacker sends "FAKE_TAG", valueOf() fails and we block it!
                throw new RuntimeException("Invalid feedback tag selected: " + tagString);
            }
        }

        // 5. Update the Receiver's Score
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        receiver.setReputationScore(receiver.getReputationScore() + totalReputationChange);
        userRepository.save(receiver);

        // 6. Save the Feedback Entity
        Feedback feedback = new Feedback();
        feedback.setSession(session);

        // LOGIC: We use getReferenceById to create a "Proxy" User object.
        // This satisfies JPA's need for an Object WITHOUT doing an expensive database fetch!
        User giverProxy = userRepository.getReferenceById(request.getGiverId());
        feedback.setGiver(giverProxy);

        feedback.setReceiver(receiver);

        // LOGIC: We join the array into a single String (e.g., "LATE_TO_SESSION, RUDE")
        // so it easily fits into your existing database column!
        feedback.setFeedbackTag(String.join(", ", request.getSelectedTags()));
        feedback.setWeight(totalReputationChange);

        // 7. Return the saved entity back to the Controller
        return feedbackRepository.save(feedback);
    }

    // LOGIC: Fetch all reviews given to a specific mentor
    public List<Feedback> getMentorFeedback(UUID mentorId) {
        return feedbackRepository.findByReceiverId(mentorId);
    }
}