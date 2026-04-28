package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.UserSearchResponse;
import com.zenware.skillsharebackend.dto.UserSkillRequest;
import com.zenware.skillsharebackend.entity.UserSkill;
import com.zenware.skillsharebackend.service.UserSkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user-skills")
@RequiredArgsConstructor
public class UserSkillController {

    private final UserSkillService userSkillService;

    @PostMapping("/add")
    public ResponseEntity<UserSkill> addSkillToUser(@RequestBody UserSkillRequest request) {
        return ResponseEntity.ok(userSkillService.addUserSkill(request));
    }

    // --- NEW FEATURE: Secure Delete Endpoint ---
    @DeleteMapping("/remove")
    public ResponseEntity<String> removeSkillFromUser(
            @RequestParam UUID skillId,
            @RequestParam String skillType) {
        // LOGIC: No userId in the request! Security context handles it.
        userSkillService.deleteUserSkill(skillId, skillType);
        return ResponseEntity.ok("Skill removed from profile successfully.");
    }

    // LOGIC: Public endpoint to view a user's skills
    @GetMapping("/{userId}")
    public ResponseEntity<List<UserSkill>> getUserSkills(@PathVariable UUID userId) {
        return ResponseEntity.ok(userSkillService.getUserProfileSkills(userId));
    }

    // --- THE DISCOVERY ENDPOINT ---
    // GET: /api/user-skills/mentors/{skillId}
    @GetMapping("/mentors/{skillId}")
    public ResponseEntity<List<UserSkill>> getMentorsBySkill(@PathVariable UUID skillId) {
        return ResponseEntity.ok(userSkillService.findMentorsBySkill(skillId));
    }

    // GET: /api/user-skills/{userId}/teach
    @GetMapping("/{userId}/teach")
    public ResponseEntity<List<UserSkill>> getTeachingSkills(@PathVariable UUID userId) {
        return ResponseEntity.ok(userSkillService.getUserTeachingSkills(userId));
    }

    // GET: /api/user-skills/{userId}/learn
    @GetMapping("/{userId}/learn")
    public ResponseEntity<List<UserSkill>> getLearningSkills(@PathVariable UUID userId) {
        return ResponseEntity.ok(userSkillService.getUserLearningSkills(userId));
    }

    // --- Auto-Suggest Profile Search Endpoint ---
    // Example Request from React: GET /api/user-skills/search-profiles?name=John
    @GetMapping("/search-profiles")
    public ResponseEntity<List<UserSearchResponse>> searchProfiles(@RequestParam("name") String name) {
        return ResponseEntity.ok(userSkillService.searchUserProfiles(name));
    }
}