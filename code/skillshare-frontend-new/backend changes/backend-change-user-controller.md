# Backend Change: UserController.java

## What
1. Made `@RequestBody(required = false) String bio` optional in `updateMyBio`:
   ```java
   @PatchMapping("/my-bio")
   public ResponseEntity<UserPublicDto> updateMyBio(@RequestBody(required = false) String bio) {
       User updatedUser = userService.updateMyBio(bio != null ? bio : "");
       return ResponseEntity.ok(mapToPublicDto(updatedUser));
   }
   ```

## Why
1. Senders or profile forms clearing their bio previously triggered Spring's `HttpMessageNotReadableException: Required request body is missing` (HTTP 400 Bad Request).
2. Allowing an empty/null payload guarantees safe profile and bio updates across all clients.

## Behavior
If the bio string is null or empty, it safely updates the user bio to an empty string instead of rejecting the request with an HTTP 400 error.
