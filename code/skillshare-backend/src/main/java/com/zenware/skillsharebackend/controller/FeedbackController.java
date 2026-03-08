package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.FeedbackRequest;
import com.zenware.skillsharebackend.dto.FeedbackTagDto;
import com.zenware.skillsharebackend.entity.Feedback;
import com.zenware.skillsharebackend.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping("/leave")
    public ResponseEntity<Feedback> submitFeedback(@RequestBody FeedbackRequest request) {
        // LOGIC: No try-catch! If it fails, the GlobalExceptionHandler will automatically take over!
        Feedback newFeedback = feedbackService.leaveFeedback(request);
        return ResponseEntity.ok(newFeedback);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Feedback>> getFeedbackForUser(@PathVariable UUID userId) {
        // Now it fetches feedback for ANY user!
        return ResponseEntity.ok(feedbackService.getUserFeedback(userId));
    }

    @GetMapping("/tags")
    public ResponseEntity<List<FeedbackTagDto>> getAvailableTags() {
        return ResponseEntity.ok(feedbackService.getAllAvailableTags());
    }
}