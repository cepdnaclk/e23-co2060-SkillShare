package com.zenware.skillsharebackend.controller;

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
}