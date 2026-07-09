package com.zenware.skillsharebackend.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

/**
 * LOGIC: We removed "int weight" and "String feedbackTag".
 * Now, the frontend must send an array of Strings (selectedTags).
 * This forces the frontend to only use the words we allow.
 */
@Data
public class FeedbackRequest {

    private UUID sessionId;

    // SECURITY UPGRADE: 'giverId' and 'receiverId' are GONE!
    // The backend will extract the giver from the JWT token.
    // It will figure out the receiver automatically by checking the Session details!

    // The new list of selected tag names
    private List<String> selectedTags;
}