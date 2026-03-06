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

    @Transactional // CRITICAL ADDITION!
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
        session.setMentor(availability.getUser()); // Extracted securely from the database
        session.setSkill(skill);
        session.setStartTime(availability.getStartTime()); // Extracted securely
        session.setEndTime(availability.getEndTime()); // Extracted securely

        // 7. Update the Availability to show it is now taken
        availability.setIsBooked(true);
        availabilityRepository.save(availability);

        // 8. Save the final Session
        return sessionRepository.save(session);
    }

    @Transactional
    public Session updateSessionStatus(UUID sessionId, UUID mentorId, String newStatus) {

        // Logic 1: Find the exact session in the database
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // Logic 2: Security Check! 🛡️
        // We must guarantee that only the assigned Mentor can accept or reject this.
        // A Learner cannot forcefully accept their own request!
        if (!session.getMentor().getId().equals(mentorId)) {
            throw new IllegalStateException("Only the assigned mentor can update this session!");
        }

        // Logic 3: Update the status (Convert to uppercase to keep the database clean)
        session.setStatus(newStatus.toUpperCase());

        // Logic 4: What happens if the Mentor says NO?
        // If rejected, we must give the time slot back to the public so someone else can book it.
        if (newStatus.equalsIgnoreCase("REJECTED")) {
            Availability availability = availabilityRepository.findByUserIdAndStartTime(
                    mentorId, session.getStartTime() // We use a custom query to find the exact slot
            ).orElseThrow(() -> new IllegalStateException("Original time slot missing"));

            // Logic: The Refund
            User learner = session.getLearner();
            learner.setCredits(learner.getCredits() + 10); // Give the 10 credits back
            userRepository.save(learner);

            availability.setIsBooked(false); // Make it available again!
            availabilityRepository.save(availability);
        }

        // Logic 5: Save and return the updated session
        return sessionRepository.save(session);
    }

    @Transactional
    public Session completeSession(UUID sessionId) {

        // Logic 1: Find the exact session in the database
        // Reason: We must fetch the current state of the session from PostgreSQL before we can modify it. If it doesn't exist, we stop immediately to prevent a crash.
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // Logic 2: Validate the current status
        // Reason: A mentor should not be able to "complete" a session that was already REJECTED, is still PENDING, or was already COMPLETED. This prevents double-paying the mentor!
        if (!session.getStatus().equalsIgnoreCase("ACCEPTED")) {
            throw new IllegalStateException("Only ACCEPTED sessions can be marked as COMPLETED!");
        }

        // Logic 3: Fetch the Mentor
        // Reason: We only need the mentor object here because the learner already paid their 10 credits upfront during the booking phase.
        User mentor = session.getMentor();

        // Logic 4: The Payout (Release the Escrow)
        // Reason: The job is done! We take the 10 credits that the system was holding and permanently add them to the mentor's wallet.
        mentor.setCredits(mentor.getCredits() + 10);

        // Logic 5: Update the session status
        // Reason: This officially closes the lifecycle of this booking and unlocks the ability for users to leave Reputation Feedback.
        session.setStatus("COMPLETED");

        // Logic 6: Save the changes to the database
        // Reason: Because of the @Transactional annotation, both of these saves happen simultaneously. The mentor's new balance and the completed session are locked in permanently.
        userRepository.save(mentor);
        return sessionRepository.save(session);
    }

    // Logic: Fetch everything where this specific user is the student
    public List<Session> getLearnerSessions(UUID learnerId) {
        return sessionRepository.findByLearnerId(learnerId);
    }

    // Logic: Fetch everything where this specific user is the teacher
    public List<Session> getMentorSessions(UUID mentorId) {
        return sessionRepository.findByMentorId(mentorId);
    }
}