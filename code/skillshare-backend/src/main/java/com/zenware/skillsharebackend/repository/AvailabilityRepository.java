package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Availability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
// LOGIC: Upgraded from Long to UUID to match your new Entity structure!
public interface AvailabilityRepository extends JpaRepository<Availability, UUID> {

    // Logic: Find all unbooked slots for a specific mentor so learners can see them
    List<Availability> findByUserIdAndIsBookedFalse(UUID userId);

    Optional<Availability> findByUserIdAndStartTime(UUID userId, LocalDateTime startTime);

    @Query("SELECT COUNT(a) FROM Availability a WHERE a.user.id = :userId AND a.startTime < :endTime AND a.endTime > :startTime")
    int countOverlappingSlots(
            @Param("userId") UUID userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    List<Availability> findByUserId(UUID mentorId);

    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE Availability a
        SET a.isBooked = true, a.activeSessionId = :sessionId
        WHERE a.id = :availabilityId
          AND a.isBooked = false
    """)
    int reserveAvailabilityAtomically(
            @Param("availabilityId") UUID availabilityId,
            @Param("sessionId") UUID sessionId
    );

    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE Availability a
        SET a.isBooked = false, a.activeSessionId = null
        WHERE a.id = :availabilityId
          AND a.activeSessionId = :sessionId
    """)
    int releaseAvailabilityAtomically(
            @Param("availabilityId") UUID availabilityId,
            @Param("sessionId") UUID sessionId
    );
}