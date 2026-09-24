package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.dto.TrendingSkillDto;
import com.zenware.skillsharebackend.entity.ParticipantStatus;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.entity.SessionStatus;
import com.zenware.skillsharebackend.entity.SessionType;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    // =========================================================
    // NORMAL SESSION QUERIES
    // =========================================================

    // Learner's sessions
    List<Session> findByLearnerId(UUID learnerId);

    // Mentor's sessions
    List<Session> findByMentorId(UUID mentorId);

    // Sessions by type and status
    List<Session> findBySessionTypeAndStatusInOrderByStartTimeAsc(
            SessionType sessionType,
            List<SessionStatus> statuses
    );


    // =========================================================
    // GROUP SESSION EXPLORATION
    // =========================================================

    /*
     * IMPORTANT:
     *
     * Full group sessions are intentionally NOT filtered out.
     *
     * Example:
     *
     *     capacity = 5
     *     joined   = 5
     *
     * The group will STILL be returned.
     *
     * The frontend can then display:
     *
     *     GROUP SESSION
     *     5 / 5 members
     *     FULL
     *
     * instead of making the time slot disappear.
     *
     * Only future GROUP sessions that are still active
     * (PENDING or ACCEPTED) are returned.
     */
    @Query("""
        SELECT s FROM Session s
        WHERE s.sessionType = com.zenware.skillsharebackend.entity.SessionType.GROUP
          AND s.status IN :statuses
          AND s.startTime > :now
        ORDER BY s.startTime ASC
    """)
    List<Session> findExplorableGroupSessions(
            @Param("statuses") List<SessionStatus> statuses,
            @Param("now") LocalDateTime now
    );


    // =========================================================
    // COUNT JOINED GROUP PARTICIPANTS
    // =========================================================

    /*
     * Counts only participants whose status is JOINED.
     *
     * PENDING and INVITED participants are not counted as
     * confirmed group members.
     *
     * Example:
     *
     *     PENDING
     *     JOINED
     *     JOINED
     *     INVITED
     *
     * Result = 2
     */
    @Query("""
        SELECT COUNT(p)
        FROM SessionParticipant p
        WHERE p.session.id = :sessionId
          AND p.status = :status
    """)
    int countJoinedParticipants(
            @Param("sessionId") UUID sessionId,
            @Param("status") ParticipantStatus status
    );


    // =========================================================
    // LOCK GROUP SESSION
    // =========================================================

    /*
     * Used when joining/updating a group session.
     *
     * PESSIMISTIC_WRITE prevents two learners from modifying
     * the same group simultaneously and exceeding capacity.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT s
        FROM Session s
        WHERE s.id = :sessionId
          AND s.sessionType =
              com.zenware.skillsharebackend.entity.SessionType.GROUP
    """)
    Optional<Session> findGroupByIdForUpdate(
            @Param("sessionId") UUID sessionId
    );


    // =========================================================
    // EXPIRATION ENGINE
    // =========================================================

    /*
     * Finds sessions whose end time has passed.
     */
    List<Session> findByStatusInAndEndTimeBefore(
            List<SessionStatus> statuses,
            LocalDateTime endTime,
            Pageable pageable
    );


    // =========================================================
    // MENTOR PENDING SESSION COUNT
    // =========================================================

    // Counts sessions waiting for a specific mentor's approval.
    long countByMentorIdAndStatus(
            UUID mentorId,
            SessionStatus status
    );


    // =========================================================
    // PENDING SESSION EXPIRATION
    // =========================================================

    /*
     * Finds pending sessions that should be expired because:
     *
     * 1. Their start time has already passed
     *
     * OR
     *
     * 2. They have been waiting too long since creation.
     */
    @Query("""
        SELECT s
        FROM Session s
        WHERE s.status = :status
          AND (
              s.startTime <= :now
              OR
              (
                  s.createdAt IS NOT NULL
                  AND s.createdAt <= :timeoutThreshold
              )
          )
    """)
    List<Session> findPendingSessionsForExpiration(
            @Param("status") SessionStatus status,
            @Param("now") LocalDateTime now,
            @Param("timeoutThreshold") LocalDateTime timeoutThreshold,
            Pageable pageable
    );


    // =========================================================
    // LEARNER UPCOMING SESSION COUNT
    // =========================================================

    // Counts sessions belonging to a learner with a specific status.
    long countByLearnerIdAndStatus(
            UUID learnerId,
            SessionStatus status
    );


    // =========================================================
    // DEMO BOT
    // =========================================================

    List<Session> findByMentorEmailAndStatus(
            String email,
            SessionStatus status
    );


    // =========================================================
    // TRENDING SKILLS
    // =========================================================

    /*
     * Fetches the most popular skills based on completed sessions.
     */
    @Query("""
        SELECT s.skill.name AS skillName,
               COUNT(s.id) AS totalSessions
        FROM Session s
        WHERE s.status = 'COMPLETED'
        GROUP BY s.skill.name
        ORDER BY totalSessions DESC
        LIMIT :limit
    """)
    List<TrendingSkillDto> findTopTrendingSkills(
            @Param("limit") int limit
    );


    // =========================================================
    // ATOMIC STATUS TRANSITION
    // =========================================================

    /*
     * Safely changes a session status only when its current
     * status is one of the expected statuses.
     *
     * This helps prevent conflicting status updates.
     */
    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE Session s
        SET s.status = :newStatus
        WHERE s.id = :sessionId
          AND s.status IN :expectedCurrentStatuses
    """)
    int transitionSessionStatusAtomically(
            @Param("sessionId") UUID sessionId,
            @Param("newStatus") SessionStatus newStatus,
            @Param("expectedCurrentStatuses") List<SessionStatus> expectedCurrentStatuses
    );


    // =========================================================
    // SHARED SESSION COUNT
    // =========================================================

    /*
     * Counts sessions shared between two users.
     *
     * This works regardless of which user is the mentor or
     * learner.
     */
    @Query("""
        SELECT COUNT(s)
        FROM Session s
        WHERE
            (s.mentor.id = :userId1 AND s.learner.id = :userId2)
            OR
            (s.mentor.id = :userId2 AND s.learner.id = :userId1)
    """)
    long countSharedSessions(
            @Param("userId1") UUID userId1,
            @Param("userId2") UUID userId2
    );
}