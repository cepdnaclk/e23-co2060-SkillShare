package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.UserPublicDto;
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
    public ResponseEntity<UserPublicDto> getUserProfile(@PathVariable UUID id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(mapToPublicDto(user));
    }

    // PATCH: /api/users/my-bio
    // SECURITY: The `{id}` is gone preventing IDor attacks.
    @PatchMapping("/my-bio")
    public ResponseEntity<UserPublicDto> updateMyBio(@RequestBody String bio) {
        User updatedUser = userService.updateMyBio(bio);
        return ResponseEntity.ok(mapToPublicDto(updatedUser));
    }

    // POST: /api/users/profile-picture
    // SECURITY: MIME-Type validation to prevent malicious script uploads
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

    // --- HELPER MAPPING ---
    // Acts as a security firewall, ensuring sensitive data (passwords, emails) never reaches the frontend.
    private UserPublicDto mapToPublicDto(User user) {
        return UserPublicDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .profilePictureUrl(user.getProfilePictureUrl())
                .xp(user.getXp() != null ? user.getXp() : 0)
                .level(user.getLevel() != null ? user.getLevel() : 1)
                .reputationScore(user.getReputationScore() != null ? user.getReputationScore() : 0)
                .build();
    }
}