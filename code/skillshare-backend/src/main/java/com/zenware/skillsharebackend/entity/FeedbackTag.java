package com.zenware.skillsharebackend.entity;

import lombok.Getter;

/**
 * LOGIC: This Enum is the "Single Source of Truth".
 * By defining the weights here, hackers cannot send fake weights
 * from the frontend to cheat the reputation system.
 */
@Getter
public enum FeedbackTag {
    // --- POSITIVE TAGS (Mentor Specific) ---
    EXCELLENT_COMMUNICATOR(5),
    DEEP_KNOWLEDGE(4),
    VERY_PATIENT(3),

    // --- POSITIVE TAGS (Common for Both) ---
    WELL_PREPARED(4),      // Mentor had a plan / Learner had clear questions
    HIGHLY_ENGAGED(3),     // Active participation from either side
    PUNCTUAL(3),           // Showed up exactly on time
    RESPECTFUL(2),         // Polite and professional behavior
    FRIENDLY(2),           // Good attitude

    // --- NEGATIVE TAGS (Mentor Specific) ---
    POOR_EXPLANATION(-3),

    // --- NEGATIVE TAGS (Common for Both) ---
    UNPREPARED(-3),        // Mentor didn't know the topic / Learner didn't know what they wanted
    DISTRACTED(-3),        // Looking at phone, not paying attention to the other person
    LEFT_EARLY(-4),        // Abandoned the session before the agreed time
    NOISY_ENVIRONMENT(-2), // Bad microphone etiquette or taking the call in a loud place
    RUDE_BEHAVIOR(-5),
    LATE_TO_SESSION(-2),
    NO_SHOW(-10);          // Massive penalty for not showing up

    // Getter so our Service can read the secret weight
    private final int weight;

    // Constructor to assign the weight to the tag
    FeedbackTag(int weight) {
        this.weight = weight;
    }

}