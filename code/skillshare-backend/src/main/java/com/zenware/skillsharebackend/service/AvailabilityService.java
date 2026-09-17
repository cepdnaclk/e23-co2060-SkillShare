package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.dto.AvailabilityResponse;
import com.zenware.skillsharebackend.entity.Availability;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // LOGIC: Modern constructor injection
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;

    // --- THE SECURITY ENGINE ---
    // LOGIC: Extracts the exact user making the request from the JWT Token.
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));
    }

    private AvailabilityResponse mapToResponse(Availability availability) {
        return AvailabilityResponse.builder()
                .id(availability.getId())
                .mentorId(availability.getUser().getId())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .isBooked(availability.getIsBooked())
                .activeSessionId(availability.getActiveSessionId())
                .build();
    }

    @Transactional
    public AvailabilityResponse addAvailability(AvailabilityRequest request) {
        // Business Logic 1: Time Travel Check!
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be strictly before end time!");
        }

        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Start time cannot be in the past!");
        }

        // Business Logic 2: Securely identify the mentor from the Token!
        User mentor = getAuthenticatedUser();

        // Business Logic 3: Overlap detection
        int overlaps = availabilityRepository.countOverlappingSlots(
                mentor.getId(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (overlaps > 0) {
            throw new IllegalStateException("Time slot overlaps with existing availability!");
        }

        // Business Logic 4: Build the actual Entity using the Builder pattern
        Availability availability = Availability.builder()
                .user(mentor)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isBooked(false)
                .build();

        Availability saved = availabilityRepository.save(availability);
        return mapToResponse(saved);
    }

    // --- NEW FEATURE: Delete Slot ---
    @Transactional
    public void deleteAvailability(UUID availabilityId) {
        Availability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new IllegalArgumentException("Time slot not found"));

        // GUARD: You can only delete your own slots!
        if (!availability.getUser().getId().equals(getAuthenticatedUser().getId())) {
            throw new com.zenware.skillsharebackend.exception.UnauthorizedAccessException("Security Violation: You can only delete your own availability!");
        }

        // GUARD: Cannot delete an actively booked slot
        if (availability.getIsBooked()) {
            throw new IllegalStateException("You cannot delete a slot that is already booked!");
        }

        availabilityRepository.delete(availability);
    }

    public List<AvailabilityResponse> getMentorFreeSlots(UUID mentorId) {
        // Just ask the repository for the unbooked slots!
        return availabilityRepository.findByUserIdAndIsBookedFalse(mentorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AvailabilityResponse> getMyAvailabilities() {
        // 1. Get the email from the current JWT token
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        // 2. Find the user in the database
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));

        // 3. Return only their slots
        return availabilityRepository.findByUserId(currentUser.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
}