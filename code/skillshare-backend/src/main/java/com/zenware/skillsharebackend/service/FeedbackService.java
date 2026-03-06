package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.FeedbackRequest;
import com.zenware.skillsharebackend.entity.Feedback;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.FeedbackRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {

    @Autowired private FeedbackRepository feedbackRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;

    @Transactional
    public Feedback leaveFeedback(FeedbackRequest request) {

        // Logic 1: Fetch the Session
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // Logic 2: Rule - Session MUST be COMPLETED
        if (!session.getStatus().equalsIgnoreCase("COMPLETED")) {
            throw new IllegalStateException("You can only leave feedback for COMPLETED sessions!");
        }

        // Logic 3: Rule - No Double Voting! 🛑
        if (feedbackRepository.existsBySessionIdAndGiverId(session.getId(), request.getGiverId())) {
            throw new IllegalStateException("You have already left feedback for this session!");
        }

        // Logic 4: Fetch Giver and Receiver
        User giver = userRepository.findById(request.getGiverId())
                .orElseThrow(() -> new IllegalArgumentException("Giver not found"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        // Logic 5: The Math (Update Reputation) 🧮
        // Reason: We extract the score safely. If the database returns null, we treat it as a 0 to prevent the NullPointerException!
        Integer currentScore = receiver.getReputationScore();
        if (currentScore == null) {
            currentScore = 0;
        }

        // Now it is perfectly safe to do the math!
        receiver.setReputationScore(currentScore + request.getWeight());
        userRepository.save(receiver);

        // Logic 6: Create and Save the Receipt
        Feedback feedback = new Feedback();
        feedback.setSession(session);
        feedback.setGiver(giver);
        feedback.setReceiver(receiver);
        feedback.setFeedbackTag(request.getFeedbackTag());
        feedback.setWeight(request.getWeight());

        return feedbackRepository.save(feedback);
    }
}