package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Availability;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, UUID> {

    List<Availability> findByUserIdAndIsBookedFalse(UUID userId);

    Optional<Availability> findByUserIdAndStartTime(
            UUID userId,
            LocalDateTime startTime
    );

    List<Availability> findByUserId(UUID userId);

    /**
     * Checks if a new time slot overlaps with any existing availability slot for a given user.
     * Uses strict inequalities (< and >) so that contiguous slots (e.g., 9:00-10:00 and 10:00-11:00)
     * are correctly allowed and do not trigger false positive overlap errors.
     */
    @Query("""
        SELECT COUNT(a)
        FROM Availability a
        WHERE a.user.id = :userId
          AND a.startTime < :endTime
          AND a.endTime > :startTime
    """)
    int countOverlappingSlots(
            @Param("userId") UUID userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    /*
     * Reserve a slot atomically.
     *
     * Both INDIVIDUAL and GROUP sessions reserve the slot.
     * The service decides how the reserved slot should be displayed.
     */
    @Modifying(flushAutomatically = true)
    @Transactional
    @Query("""
        UPDATE Availability a
        SET a.isBooked = true,
            a.activeSessionId = :sessionId
        WHERE a.id = :availabilityId
          AND a.isBooked = false
    """)
    int reserveAvailabilityAtomically(
            @Param("availabilityId") UUID availabilityId,
            @Param("sessionId") UUID sessionId
    );

    /*
     * Release the slot when a group/individual session is cancelled
     * or expired.
     */
    @Modifying(flushAutomatically = true)
    @Transactional
    @Query("""
        UPDATE Availability a
        SET a.isBooked = false,
            a.activeSessionId = null
        WHERE a.id = :availabilityId
          AND a.activeSessionId = :sessionId
    """)
    int releaseAvailabilityAtomically(
            @Param("availabilityId") UUID availabilityId,
            @Param("sessionId") UUID sessionId
    );
}