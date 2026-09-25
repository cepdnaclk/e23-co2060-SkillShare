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

    // FIX: excludes slots whose startTime has already passed — used by
    // getMentorFreeSlots so learners never see/book a stale, expired offering.
    List<Availability> findByUserIdAndIsBookedFalseAndStartTimeAfter(UUID userId, LocalDateTime now);

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

    // FIX (this bug): bulk-deletes availability slots that were never booked
    // and whose window has already closed. Safe — Session.availabilityId is a
    // plain UUID column, not a mapped FK, so this cannot orphan session history.
    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM Availability a WHERE a.isBooked = false AND a.startTime < :cutoff")
    int deleteExpiredUnbookedSlots(@Param("cutoff") LocalDateTime cutoff);
}