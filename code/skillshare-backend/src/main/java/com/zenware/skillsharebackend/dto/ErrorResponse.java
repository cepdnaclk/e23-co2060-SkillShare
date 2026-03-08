package com.zenware.skillsharebackend.dto;

import java.time.LocalDateTime;

/**
 * LOGIC: This is a simple Data Transfer Object (DTO).
 * It ensures that every error sent to the frontend has the
 * EXACT same structure (Timestamp, Status, and Message).
 */
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;

    public ErrorResponse(int status, String error, String message) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.error = error;
        this.message = message;
    }

    // Getters and Setters
    public LocalDateTime getTimestamp() { return timestamp; }
    public int getStatus() { return status; }
    public String getError() { return error; }
    public String getMessage() { return message; }
}