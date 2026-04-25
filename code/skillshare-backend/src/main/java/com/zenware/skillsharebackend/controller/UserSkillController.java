package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.UserSkillRequest;
import com.zenware.skillsharebackend.entity.UserSkill;
import com.zenware.skillsharebackend.service.UserSkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-skills")
@RequiredArgsConstructor
public class UserSkillController {

    private final UserSkillService userSkillService;

    // If userSkillService throws an error, GlobalExceptionHandler
    // will catch it and send the exact message to the user automatically.
    @PostMapping("/add")
    public ResponseEntity<UserSkill> addSkillToUser(@RequestBody UserSkillRequest request) {
        return ResponseEntity.ok(userSkillService.addUserSkill(request));
    }
}