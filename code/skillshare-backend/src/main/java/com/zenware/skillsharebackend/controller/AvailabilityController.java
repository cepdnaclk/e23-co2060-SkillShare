package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.dto.AvailabilityResponse;
import com.zenware.skillsharebackend.service.AvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @PostMapping("/add")
    public ResponseEntity<AvailabilityResponse> addAvailability(
            @Valid @RequestBody AvailabilityRequest request
    ) {
        return ResponseEntity.ok(
                availabilityService.addAvailability(request)
        );
    }

    @DeleteMapping("/{availabilityId}")
    public ResponseEntity<String> deleteAvailability(
            @PathVariable UUID availabilityId
    ) {
        availabilityService.deleteAvailability(availabilityId);

        return ResponseEntity.ok(
                "Availability slot deleted successfully."
        );
    }

    /*
     * Public mentor availability used when booking a session.
     *
     * The service returns:
     * - free slots
     * - active group-session slots
     *
     * Individual-booked slots are hidden.
     */
    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<AvailabilityResponse>> getMentorSlots(
            @PathVariable UUID mentorId
    ) {
        return ResponseEntity.ok(
                availabilityService.getMentorFreeSlots(mentorId)
        );
    }

    @GetMapping("/my-slots")
    public ResponseEntity<List<AvailabilityResponse>> getMyAvailabilities() {
        return ResponseEntity.ok(
                availabilityService.getMyAvailabilities()
        );
    }
}