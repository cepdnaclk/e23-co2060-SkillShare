package com.zenware.skillsharebackend.entity;

/**
 * LOGIC: Represents the complete lifecycle of a Skill-Sharing Session.
 */
public enum SessionStatus {
    OPEN,      // Group session is accepting participants
    FULL,      // Group capacity has been reached
    PENDING,   // Learner requested, waiting for Mentor's response
    ACCEPTED,  // Mentor agreed to the session
    REJECTED,  // Mentor declined the session request
    COMPLETED, // Session finished, credits transferred successfully
    CLOSED,    // Administrative closure (e.g., by system admin or support)
    CANCELLED, // Session canceled by either party before completion
    EXPIRED    // Session request timed out before mentor accepted
}
