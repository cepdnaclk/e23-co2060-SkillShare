package com.zenware.skillsharebackend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.dto.AvailabilityResponse;
import com.zenware.skillsharebackend.service.AvailabilityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor // LOGIC: Modern constructor injection
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @PostMapping("/add")
    public ResponseEntity<AvailabilityResponse> addAvailability(@Valid @RequestBody AvailabilityRequest request) {
        // LOGIC: try-catch is GONE!
        // Any error thrown by the service is caught by your GlobalExceptionHandler.
        return ResponseEntity.ok(availabilityService.addAvailability(request));
    }

    // --- FEATURE: Secure Delete Endpoint ---
    @DeleteMapping("/{availabilityId}")
    public ResponseEntity<String> deleteAvailability(@PathVariable UUID availabilityId) {
        // LOGIC: No userId needed in the URL. The service extracts it securely from JWT!
        availabilityService.deleteAvailability(availabilityId);
        return ResponseEntity.ok("Availability slot deleted successfully.");
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<AvailabilityResponse>> getMentorSlots(@PathVariable UUID mentorId) {
        return ResponseEntity.ok(availabilityService.getMentorFreeSlots(mentorId));
    }

    @GetMapping("/my-slots")
    public ResponseEntity<List<AvailabilityResponse>> getMyAvailabilities() {
        return ResponseEntity.ok(availabilityService.getMyAvailabilities());
    }

    // FIX (this bug): manual trigger for the cleanup engine, mirroring the
    // existing /api/sessions/expire-overdue pattern. Admin-only — see SecurityConfig.
    @PostMapping("/cleanup-expired")
    public ResponseEntity<String> triggerCleanupEngine() {
        int deletedCount = availabilityService.cleanupExpiredUnbookedSlots();
        return ResponseEntity.ok("Cleanup complete! Deleted " + deletedCount + " expired, never-booked slots.");
    }
}