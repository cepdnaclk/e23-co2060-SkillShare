package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.FeedbackRequest;
import com.zenware.skillsharebackend.dto.FeedbackResponse;
import com.zenware.skillsharebackend.dto.FeedbackTagDto;
import com.zenware.skillsharebackend.entity.Feedback;
import com.zenware.skillsharebackend.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor // LOGIC: Modern Constructor Injection!
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/leave")
    public ResponseEntity<FeedbackResponse> submitFeedback(@RequestBody FeedbackRequest request) {
        // LOGIC: No try-catch! If it fails, the GlobalExceptionHandler will automatically take over.
        // SECURITY: The giver is determined strictly by the JWT token, not the request body.
        FeedbackResponse newFeedback = feedbackService.leaveFeedback(request);
        return ResponseEntity.ok(newFeedback);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<FeedbackResponse>> getFeedbackForUser(@PathVariable UUID userId) {
        // LOGIC: Public endpoint. Anyone can see the public reviews of any Mentor/Learner.
        return ResponseEntity.ok(feedbackService.getUserFeedback(userId));
    }

    @GetMapping("/tags")
    public ResponseEntity<List<FeedbackTagDto>> getAvailableTags() {
        // LOGIC: Feeds the frontend the exact dropdown options and weights dynamically.
        return ResponseEntity.ok(feedbackService.getAllAvailableTags());
    }
}