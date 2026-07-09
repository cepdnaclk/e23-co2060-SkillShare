package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.entity.Availability;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

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

    @Transactional
    public Availability addAvailability(AvailabilityRequest request) {
        // Business Logic 1: Time Travel Check!
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time!");
        }

        // Business Logic 2: Securely identify the mentor from the Token!
        User mentor = getAuthenticatedUser();

        // Business Logic 3: Build the actual Entity using the Builder pattern
        Availability availability = Availability.builder()
                .user(mentor)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isBooked(false)
                .build();

        return availabilityRepository.save(availability);
    }

    // --- NEW FEATURE: Delete Slot ---
    @Transactional
    public void deleteAvailability(UUID availabilityId) {
        Availability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new IllegalArgumentException("Time slot not found"));

        // GUARD: You can only delete your own slots!
        if (!availability.getUser().getId().equals(getAuthenticatedUser().getId())) {
            throw new IllegalStateException("Security Violation: You can only delete your own availability!");
        }

        // GUARD: Cannot delete an actively booked slot
        if (availability.getIsBooked()) {
            throw new IllegalStateException("You cannot delete a slot that is already booked!");
        }

        availabilityRepository.delete(availability);
    }

    public List<Availability> getMentorFreeSlots(UUID mentorId) {
        // Just ask the repository for the unbooked slots!
        return availabilityRepository.findByUserIdAndIsBookedFalse(mentorId);
    }

    public List<Availability> getMyAvailabilities() {
        // 1. Get the email from the current JWT token
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        // 2. Find the user in the database
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));

        // 3. Return only their slots
        return availabilityRepository.findByUserId(currentUser.getId());
    }
}