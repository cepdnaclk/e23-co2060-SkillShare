package com.zenware.skillsharebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * LOGIC: This tells the frontend the name of the tag, its secret weight,
 * and whether it should be colored Green (POSITIVE) or Red (NEGATIVE) on the UI.
 */
@Data
@AllArgsConstructor
public class FeedbackTagDto {
    private String name;    // e.g., "EXCELLENT_COMMUNICATOR"
    private int weight;     // e.g., 5
    private String type;    // e.g., "POSITIVE"
}