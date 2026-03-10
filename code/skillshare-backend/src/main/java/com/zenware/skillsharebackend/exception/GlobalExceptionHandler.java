package com.zenware.skillsharebackend.exception;

import com.zenware.skillsharebackend.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * LOGIC: The @RestControllerAdvice makes this class a global "Intercepter".
 * It catches exceptions thrown by any controller and converts them
 * into our custom ErrorResponse JSON.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Handle Business Rule Violations (State Conflicts)
    // REASON: Catches things like "Not enough credits" or "Slot already booked" from SessionService!
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.CONFLICT.value(), // 409 Conflict is perfect for state errors!
                "Business Rule Violation",
                ex.getMessage()
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    // 2. Handle Bad Inputs & Missing Data
    // REASON: Catches "User not found", "Email taken", or "Skill name cannot be empty"
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        // LOGIC: Since we use this for bad inputs, 400 Bad Request is the safest universal code.
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Invalid Request",
                ex.getMessage()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // 3. Handle Generic Runtime Exceptions (The "Catch-All" for other logic errors)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Logic Violation",
                ex.getMessage()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // 4. Handle Unexpected Server Crashes
    // REASON: This is the "Safety Net" preventing raw stack traces from leaking to the frontend.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Server Error",
                "An unexpected error occurred on our end."
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}