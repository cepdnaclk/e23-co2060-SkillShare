package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.FeedbackRequest;
import com.zenware.skillsharebackend.entity.Feedback;
import com.zenware.skillsharebackend.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping("/leave")
    public ResponseEntity<?> submitFeedback(@RequestBody FeedbackRequest request) {
        try {
            Feedback newFeedback = feedbackService.leaveFeedback(request);
            return ResponseEntity.ok(newFeedback);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}