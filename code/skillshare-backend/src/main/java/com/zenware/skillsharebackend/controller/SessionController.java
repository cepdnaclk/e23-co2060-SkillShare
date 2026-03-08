package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.entity.SessionStatus;
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
    public ResponseEntity<Session> bookSession(@RequestBody SessionRequest request) {
        // LOGIC: No try-catch. If the service throws an error, the GlobalExceptionHandler catches it!
        Session newSession = sessionService.bookSession(request);
        return ResponseEntity.ok(newSession);
    }

    @PatchMapping("/{sessionId}/status")
    public ResponseEntity<Session> updateStatus(
            @PathVariable UUID sessionId,
            @RequestParam UUID mentorId,
            @RequestParam SessionStatus status) { // LOGIC: Accept the Enum directly! Spring auto-converts the URL string.

        Session updatedSession = sessionService.updateSessionStatus(sessionId, mentorId, status);
        return ResponseEntity.ok(updatedSession);
    }

    @PatchMapping("/{sessionId}/complete")
    public ResponseEntity<Session> completeSession(@PathVariable UUID sessionId) {
        Session completedSession = sessionService.completeSession(sessionId);
        return ResponseEntity.ok(completedSession);
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