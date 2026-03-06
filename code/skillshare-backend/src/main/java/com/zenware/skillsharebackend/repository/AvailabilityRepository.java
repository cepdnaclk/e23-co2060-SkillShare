package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Availability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    // Logic: Find all unbooked slots for a specific mentor so learners can see them
    List<Availability> findByUserIdAndIsBookedFalse(UUID userId);

    Optional<Availability> findByUserIdAndStartTime(UUID userId, LocalDateTime startTime);
}