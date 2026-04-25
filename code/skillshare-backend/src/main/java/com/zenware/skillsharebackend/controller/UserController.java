package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.UserSkillRequest;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // LOGIC: The /register endpoint is REMOVED from here.
    // Use POST /api/auth/register instead.

    // GET: /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // POST: /api/users/skills
    @PostMapping("/skills")
    public ResponseEntity<String> addSkill(@RequestBody UserSkillRequest request) {
        userService.addSkillToUser(request);
        return ResponseEntity.ok("Skill linked to user successfully!");
    }

    // PATCH: /api/users/{id}/bio
    @PatchMapping("/{id}/bio")
    public ResponseEntity<User> updateBio(@PathVariable UUID id, @RequestBody String bio) {
        return ResponseEntity.ok(userService.updateBio(id, bio));
    }
}