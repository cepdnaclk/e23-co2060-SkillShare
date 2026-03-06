package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @PostMapping("/book")
    public ResponseEntity<?> bookSession(@RequestBody SessionRequest request) {
        try {
            Session newSession = sessionService.bookSession(request);
            return ResponseEntity.ok(newSession);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{sessionId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID sessionId,
            @RequestParam UUID mentorId,
            @RequestParam String status) {
        try {
            Session updatedSession = sessionService.updateSessionStatus(sessionId, mentorId, status);
            return ResponseEntity.ok(updatedSession);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{sessionId}/complete")
    public ResponseEntity<?> completeSession(@PathVariable UUID sessionId) {
        try {
            // Logic: We pass the ID from the URL directly into the Service we just updated!
            Session completedSession = sessionService.completeSession(sessionId);
            return ResponseEntity.ok(completedSession);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/learner/{userId}")
    public ResponseEntity<List<Session>> getMyClasses(@PathVariable UUID userId) {
        return ResponseEntity.ok(sessionService.getLearnerSessions(userId));
    }

    @GetMapping("/mentor/{userId}")
    public ResponseEntity<List<Session>> getMyTeachingSchedule(@PathVariable UUID userId) {
        return ResponseEntity.ok(sessionService.getMentorSessions(userId));
    }

}