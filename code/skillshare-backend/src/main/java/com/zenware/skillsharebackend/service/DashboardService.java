package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.DashboardResponse;
import com.zenware.skillsharebackend.entity.SessionStatus;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.FeedbackRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final UserSkillRepository userSkillRepository;
    private final FeedbackRepository feedbackRepository;

    // --- THE SECURITY ENGINE ---
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));
    }

    public DashboardResponse getMyDashboardStats() {
        User me = getAuthenticatedUser();
        UUID myId = me.getId();

        // 1. Calculate Pending Requests (Where I am the Mentor, and it is PENDING)
        long pendingRequests = sessionRepository.countByMentorIdAndStatus(myId, SessionStatus.PENDING);

        // 2. Calculate Booked Sessions (Where I am either Mentor or Learner, and it is ACCEPTED)
        long bookedAsMentor = sessionRepository.countByMentorIdAndStatus(myId, SessionStatus.ACCEPTED);
        long bookedAsLearner = sessionRepository.countByLearnerIdAndStatus(myId, SessionStatus.ACCEPTED);
        long totalBooked = bookedAsMentor + bookedAsLearner;

        // 3. Calculate Skills Added (Only counting "TEACH" skills based on your UI requirement)
        long skillsAdded = userSkillRepository.countByUserIdAndIdSkillType(myId, "TEACH");

        // 4. Calculate Feedback Received
        long feedbackCount = feedbackRepository.countBySessionMentorId(myId);

        // Build and return the payload perfectly formatted for the frontend
        return DashboardResponse.builder()
                .fullName(me.getFullName())
                .credits(me.getCredits() != null ? me.getCredits() : 0)
                .bookedSessions((int) totalBooked)
                .pendingRequests((int) pendingRequests)
                .skillsAdded((int) skillsAdded)
                .feedbackReceived((int) feedbackCount)
                .reputationScore(me.getReputationScore() != null ? me.getReputationScore() : 0)
                .averageRating(0.0) // Hardcoded to 0.0 for now until you implement the rating math!
                .build();
    }
}