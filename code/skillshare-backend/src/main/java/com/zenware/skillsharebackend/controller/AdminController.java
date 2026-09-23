package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.AdminOverviewDto;
import com.zenware.skillsharebackend.dto.AdminSessionDto;
import com.zenware.skillsharebackend.dto.AdminUpdateUserRequest;
import com.zenware.skillsharebackend.dto.AdminUserDto;
import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewDto> getOverview() {
        return ResponseEntity.ok(adminService.getOverview());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getUsers(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(adminService.getUsers(q));
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<AdminUserDto> updateUser(
            @PathVariable UUID userId,
            @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(userId, request));
    }

    @GetMapping("/skills")
    public ResponseEntity<List<Skill>> getSkills() {
        return ResponseEntity.ok(adminService.getSkills());
    }

    @PostMapping("/skills")
    public ResponseEntity<Skill> createSkill(@RequestBody Skill skill) {
        return ResponseEntity.ok(adminService.createSkill(skill));
    }

    @DeleteMapping("/skills/{skillId}")
    public ResponseEntity<Void> deleteSkill(@PathVariable UUID skillId) {
        adminService.deleteSkill(skillId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<AdminSessionDto>> getSessions() {
        return ResponseEntity.ok(adminService.getRecentSessions());
    }
}
