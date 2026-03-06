package com.zenware.skillsharebackend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class FeedbackRequest {
    private UUID sessionId;
    private UUID giverId;
    private UUID receiverId;
    private String feedbackTag;
    private Integer weight;
}