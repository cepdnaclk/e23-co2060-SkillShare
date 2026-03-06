package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.UserSkillRequest;
import com.zenware.skillsharebackend.entity.UserSkill;
import com.zenware.skillsharebackend.service.UserSkillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-skills")
public class UserSkillController {

    @Autowired
    private UserSkillService userSkillService;

    @PostMapping("/add")
    public ResponseEntity<?> addSkillToUser(@RequestBody UserSkillRequest request) {
        try {
            UserSkill savedUserSkill = userSkillService.addUserSkill(request);
            return ResponseEntity.ok(savedUserSkill);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}