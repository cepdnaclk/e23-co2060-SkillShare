package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.service.FileUploadService;
import com.zenware.skillsharebackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FileUploadService fileUploadService;

    // GET: /api/users/{id}
    // LOGIC: Publicly visible endpoint so learners can view a mentor's profile
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // PATCH: /api/users/my-bio
    // SECURITY: Notice the `{id}` is gone! It is impossible for hackers to
    // pass another user's ID to change their bio.
    @PatchMapping("/my-bio")
    public ResponseEntity<User> updateMyBio(@RequestBody String bio) {
        return ResponseEntity.ok(userService.updateMyBio(bio));
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        try {
            // Guardrail 1: Ensure a file was actually sent
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Please select a file to upload.");
            }

            // Guardrail 2: ZERO-TRUST MIME-Type Check
            // This strictly blocks non-image files (like .exe, .sh, or .js disguised as images)
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Security Violation: Only image files are allowed.");
            }

            // Upload the file and get the URL back
            String imageUrl = fileUploadService.uploadProfilePicture(file);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Profile picture updated!",
                    "imageUrl", imageUrl
            ));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to upload image. Please try again.");
        }
    }
}