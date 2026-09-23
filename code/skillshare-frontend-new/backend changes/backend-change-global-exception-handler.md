# Backend Change: GlobalExceptionHandler.java

## What
1. Added an explicit exception handler for `HttpRequestMethodNotSupportedException` mapping to `405 Method Not Allowed`.
2. Enhanced the fallback `handleGlobalException(Exception ex)` method to pass `ex.getMessage()` when available rather than a static string.

## Why
Previously, unsupported HTTP methods (such as hitting an endpoint with the wrong verb or hitting an endpoint on a stale server) were caught by the generic `Exception` fallback handler and returned as a generic `500 Internal Server Error`. Providing explicit handling gives clear HTTP status codes (`405`) and descriptive messages for easier frontend debugging.

## Behavior
When an incoming request uses an unsupported HTTP method for a URL, Spring Boot returns a structured JSON `ErrorResponse` with status `405` and description `Method Not Allowed`. In the event of an unexpected server error, `ex.getMessage()` is included in the JSON response payload.
