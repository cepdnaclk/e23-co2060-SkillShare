package com.zenware.skillsharebackend.entity;

import lombok.Getter;

/**
 * LOGIC: This Enum is the "Single Source of Truth".
 * By defining the weights here, hackers cannot send fake weights
 * from the frontend to cheat the reputation system.
 */
@Getter
public enum FeedbackTag {
    // --- POSITIVE TAGS ---
    EXCELLENT_COMMUNICATOR(5),
    DEEP_KNOWLEDGE(4),
    VERY_PATIENT(3),
    FRIENDLY(2),

    // --- NEGATIVE TAGS ---
    LATE_TO_SESSION(-2),
    POOR_EXPLANATION(-3),
    RUDE_BEHAVIOR(-5),
    NO_SHOW(-10); // Massive penalty for not showing up

    // Getter so our Service can read the secret weight
    private final int weight;

    // Constructor to assign the weight to the tag
    FeedbackTag(int weight) {
        this.weight = weight;
    }

}