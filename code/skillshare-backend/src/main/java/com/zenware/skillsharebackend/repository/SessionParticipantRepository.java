package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.SessionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import com.zenware.skillsharebackend.entity.ParticipantStatus;

public interface SessionParticipantRepository extends JpaRepository<SessionParticipant, UUID> {
    boolean existsBySessionIdAndUserId(UUID sessionId, UUID userId);
    long countBySessionId(UUID sessionId);
    long countBySessionIdAndStatus(UUID sessionId, ParticipantStatus status);
    Optional<SessionParticipant> findBySessionIdAndUserId(UUID sessionId, UUID userId);
    List<SessionParticipant> findBySessionIdOrderByJoinedAtAsc(UUID sessionId);
    List<SessionParticipant> findByUserId(UUID userId);
    void deleteBySessionIdAndUserId(UUID sessionId, UUID userId);
}
