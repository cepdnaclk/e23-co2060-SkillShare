package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.entity.Availability;
import com.zenware.skillsharebackend.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor // LOGIC: Modern constructor injection
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @PostMapping("/add")
    public ResponseEntity<Availability> addAvailability(@RequestBody AvailabilityRequest request) {
        // LOGIC: try-catch is GONE!
        // Any error thrown by the service is caught by your GlobalExceptionHandler.
        return ResponseEntity.ok(availabilityService.addAvailability(request));
    }

    // --- NEW FEATURE: Secure Delete Endpoint ---
    @DeleteMapping("/{availabilityId}")
    public ResponseEntity<String> deleteAvailability(@PathVariable UUID availabilityId) {
        // LOGIC: No userId needed in the URL. The service extracts it securely from JWT!
        availabilityService.deleteAvailability(availabilityId);
        return ResponseEntity.ok("Availability slot deleted successfully.");
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<Availability>> getMentorSlots(@PathVariable UUID mentorId) {
        return ResponseEntity.ok(availabilityService.getMentorFreeSlots(mentorId));
    }

    @GetMapping("/my-slots")
    public ResponseEntity<List<Availability>> getMyAvailabilities() {
        return ResponseEntity.ok(availabilityService.getMyAvailabilities());
    }
}