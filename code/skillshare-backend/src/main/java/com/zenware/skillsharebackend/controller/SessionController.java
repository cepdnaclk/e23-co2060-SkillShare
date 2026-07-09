package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.entity.SessionStatus;
import com.zenware.skillsharebackend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor // LOGIC: Constructor Injection
public class SessionController {

    private final SessionService sessionService;

    @PostMapping("/book")
    public ResponseEntity<Session> bookSession(@RequestBody SessionRequest request) {
        return ResponseEntity.ok(sessionService.bookSession(request));
    }

    @PatchMapping("/{sessionId}/status")
    public ResponseEntity<Session> updateStatus(
            @PathVariable UUID sessionId,
            @RequestParam SessionStatus status) {

        // SECURITY UPGRADE: Removed @RequestParam UUID mentorId
        // The Mentor's identity is now pulled directly from the JWT Context!
        Session updatedSession = sessionService.updateSessionStatus(sessionId, status);
        return ResponseEntity.ok(updatedSession);
    }

    @PatchMapping("/{sessionId}/complete")
    public ResponseEntity<Session> completeSession(@PathVariable UUID sessionId) {
        Session completedSession = sessionService.completeSession(sessionId);
        return ResponseEntity.ok(completedSession);
    }

    @PutMapping("/{sessionId}/cancel")
    public ResponseEntity<Session> cancelSession(@PathVariable UUID sessionId) {
        // SECURITY UPGRADE: Removed @RequestParam UUID userId
        // The Canceling User's identity is pulled directly from JWT!
        return ResponseEntity.ok(sessionService.cancelSession(sessionId));
    }

    @GetMapping("/learner/{userId}")
    public ResponseEntity<List<Session>> getMyClasses(@PathVariable UUID userId) {
        return ResponseEntity.ok(sessionService.getLearnerSessions(userId));
    }

    @GetMapping("/mentor/{userId}")
    public ResponseEntity<List<Session>> getMyTeachingSchedule(@PathVariable UUID userId) {
        return ResponseEntity.ok(sessionService.getMentorSessions(userId));
    }

    @PostMapping("/expire-overdue")
    public ResponseEntity<String> triggerExpirationEngine() {
        int expiredCount = sessionService.expireOverdueSessions();
        return ResponseEntity.ok("Expiration Engine Run Complete! Automatically refunded and expired " + expiredCount + " sessions.");
    }

    // PATCH: /api/sessions/{sessionId}/meeting-link
    @PatchMapping("/{sessionId}/meeting-link")
    public ResponseEntity<Session> addMeetingLink(
            @PathVariable UUID sessionId,
            @RequestBody Map<String, String> payload) {

        String link = payload.get("meetingLink");

        if (link == null || link.trim().isEmpty()) {
            throw new IllegalArgumentException("Meeting link cannot be empty!");
        }

        return ResponseEntity.ok(sessionService.addMeetingLink(sessionId, link));
    }
}