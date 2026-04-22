package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    // Logic: A critical security check! We use this to see if the user already reviewed this session.
    boolean existsBySessionIdAndGiverId(UUID sessionId, UUID giverId);

    List<Feedback> findByReceiverId(UUID receiverId);

    long countBySessionId(UUID id);
}