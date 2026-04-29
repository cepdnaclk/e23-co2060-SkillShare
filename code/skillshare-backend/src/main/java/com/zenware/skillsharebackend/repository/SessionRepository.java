package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    // LOGIC: Let learners see the history of classes they took
    List<Session> findByLearnerId(UUID learnerId);

    // LOGIC: Let mentors see the classes they are scheduled to teach
    List<Session> findByMentorId(UUID mentorId);

    // LOGIC: Finds sessions matching specific statuses where the time has passed!
    // This is the query that powers the Expiration Engine
    List<Session> findByStatusInAndEndTimeBefore(List<SessionStatus> statuses, LocalDateTime endTime);

    // Counts how many sessions are awaiting the mentor's approval
    long countByMentorIdAndStatus(UUID mentorId, com.zenware.skillsharebackend.entity.SessionStatus status);

    // Counts upcoming sessions for the learner
    long countByLearnerIdAndStatus(UUID learnerId, com.zenware.skillsharebackend.entity.SessionStatus status);
}