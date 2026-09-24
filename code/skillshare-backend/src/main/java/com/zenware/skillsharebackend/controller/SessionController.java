package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.dto.SessionResponse;
import com.zenware.skillsharebackend.entity.SessionStatus;
import com.zenware.skillsharebackend.entity.ParticipantStatus;
import com.zenware.skillsharebackend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping("/book")
    public ResponseEntity<SessionResponse> bookSession(@RequestBody SessionRequest request) {
        return ResponseEntity.ok(sessionService.bookSession(request));
    }

    @GetMapping("/groups")
    public ResponseEntity<List<SessionResponse>> getGroupSessions() {
        return ResponseEntity.ok(sessionService.getOpenGroupSessions());
    }

    @GetMapping("/explore/groups")
    public ResponseEntity<List<SessionResponse>> exploreGroupSessions() {
        return ResponseEntity.ok(sessionService.exploreGroupSessions());
    }

    @GetMapping("/groups/mine")
    public ResponseEntity<List<SessionResponse>> getMyGroupSessions() {
        return ResponseEntity.ok(sessionService.getMyGroupSessions());
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> getGroupSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.getGroupSession(sessionId));
    }

    @PostMapping("/{sessionId}/join")
    public ResponseEntity<SessionResponse> joinGroupSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.joinGroupSession(sessionId));
    }

    @PostMapping("/{sessionId}/decline")
    public ResponseEntity<SessionResponse> declineGroupInvitation(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.declineGroupInvitation(sessionId));
    }

    @PostMapping("/{sessionId}/leave")
    public ResponseEntity<SessionResponse> leaveGroupSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.leaveGroupSession(sessionId));
    }

    @PostMapping("/{sessionId}/invite/{userId}")
    public ResponseEntity<SessionResponse> inviteToGroupSession(@PathVariable UUID sessionId, @PathVariable UUID userId) {
        return ResponseEntity.ok(sessionService.inviteToGroupSession(sessionId, userId));
    }

    @PatchMapping("/{sessionId}/participants/{userId}/status")
    public ResponseEntity<SessionResponse> updateGroupParticipantStatus(@PathVariable UUID sessionId, @PathVariable UUID userId, @RequestParam ParticipantStatus status) {
        return ResponseEntity.ok(sessionService.updateGroupParticipantStatus(sessionId, userId, status));
    }

    @DeleteMapping("/{sessionId}/participants/{userId}")
    public ResponseEntity<SessionResponse> removeGroupParticipant(@PathVariable UUID sessionId, @PathVariable UUID userId) {
        return ResponseEntity.ok(sessionService.removeGroupParticipant(sessionId, userId));
    }

    @PatchMapping("/{sessionId}/status")
    public ResponseEntity<SessionResponse> updateStatus(
            @PathVariable UUID sessionId,
            @RequestParam SessionStatus status) {
        SessionResponse updatedSession = sessionService.updateSessionStatus(sessionId, status);
        return ResponseEntity.ok(updatedSession);
    }

    @PatchMapping("/{sessionId}/complete")
    public ResponseEntity<SessionResponse> completeSession(@PathVariable UUID sessionId) {
        SessionResponse completedSession = sessionService.completeSession(sessionId);
        return ResponseEntity.ok(completedSession);
    }

    @PutMapping("/{sessionId}/cancel")
    public ResponseEntity<SessionResponse> cancelSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.cancelSession(sessionId));
    }

    @GetMapping("/learner/{userId}")
    public ResponseEntity<List<SessionResponse>> getMyClasses(@PathVariable UUID userId) {
        return ResponseEntity.ok(sessionService.getLearnerSessions(userId));
    }

    @GetMapping("/mentor/{userId}")
    public ResponseEntity<List<SessionResponse>> getMyTeachingSchedule(@PathVariable UUID userId) {
        return ResponseEntity.ok(sessionService.getMentorSessions(userId));
    }

    @PostMapping("/expire-overdue")
    public ResponseEntity<String> triggerExpirationEngine() {
        int expiredCount = sessionService.expireOverdueSessions();
        return ResponseEntity.ok("Expiration Engine Run Complete! Automatically refunded and expired " + expiredCount + " sessions.");
    }

    @PatchMapping("/{sessionId}/meeting-link")
    public ResponseEntity<SessionResponse> addMeetingLink(
            @PathVariable UUID sessionId,
            @RequestBody Map<String, String> payload) {

        String link = payload.get("meetingLink");

        if (link == null || link.trim().isEmpty()) {
            throw new IllegalArgumentException("Meeting link cannot be empty!");
        }

        return ResponseEntity.ok(sessionService.addMeetingLink(sessionId, link));
    }
}