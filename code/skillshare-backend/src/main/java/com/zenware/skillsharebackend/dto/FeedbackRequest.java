package com.zenware.skillsharebackend.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

/**
 * LOGIC: We removed "int weight" and "String feedbackTag".
 * Now, the frontend must send an array of Strings (selectedTags).
 * This forces the frontend to only use the words we allow.
 * * We also added @Data from Lombok to instantly generate all Getters and Setters!
 */
@Data
public class FeedbackRequest {

    private UUID sessionId;
    private UUID giverId;
    private UUID receiverId;

    // The new list of selected tag names
    private List<String> selectedTags;
}