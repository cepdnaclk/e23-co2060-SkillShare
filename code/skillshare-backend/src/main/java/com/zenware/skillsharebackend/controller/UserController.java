package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService; // We inject the Service

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User savedUser = userService.registerNewUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (IllegalArgumentException e) {
            // If the Service throws an error (like duplicate email), return a 400 Bad Request
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}