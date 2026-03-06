package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.entity.Availability;
import com.zenware.skillsharebackend.service.AvailabilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    @Autowired
    private AvailabilityService availabilityService;

    @PostMapping("/add")
    public ResponseEntity<?> addAvailability(@RequestBody AvailabilityRequest request) {
        try {
            Availability savedSlot = availabilityService.addAvailability(request);
            return ResponseEntity.ok(savedSlot);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<Availability>> getMentorSlots(@PathVariable UUID mentorId) {
        return ResponseEntity.ok(availabilityService.getMentorFreeSlots(mentorId));
    }
}