package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class SessionService {

    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SkillRepository skillRepository;
    @Autowired private AvailabilityRepository availabilityRepository;

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

        // 8. Save the final Session
        return sessionRepository.save(session);
    }

    @Transactional
    // LOGIC EXPLANATION: Changed 'String newStatus' to 'SessionStatus newStatus'
    // Now, nobody can accidentally pass a fake word into this method!
    public Session updateSessionStatus(UUID sessionId, UUID mentorId, SessionStatus newStatus) {

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!session.getMentor().getId().equals(mentorId)) {
            throw new IllegalStateException("Only the assigned mentor can update this session!");
        }

        // LOGIC EXPLANATION: We just assign the Enum directly.
        session.setStatus(newStatus);

        // LOGIC EXPLANATION: Using the '==' operator because Enums are memory-safe singletons.
        if (newStatus == SessionStatus.REJECTED) {
            Availability availability = availabilityRepository.findByUserIdAndStartTime(
                    mentorId, session.getStartTime()
            ).orElseThrow(() -> new IllegalStateException("Original time slot missing"));

            User learner = session.getLearner();
            learner.setCredits(learner.getCredits() + 10);
            userRepository.save(learner);

            availability.setIsBooked(false);
            availabilityRepository.save(availability);
        }

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
}