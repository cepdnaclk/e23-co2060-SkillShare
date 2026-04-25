package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @PostMapping("/add")
    public ResponseEntity<Skill> addSkill(@RequestBody Skill skill) {
        return ResponseEntity.ok(skillService.addSkill(skill));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Skill>> searchSkills(@RequestParam String q) {
        return ResponseEntity.ok(skillService.searchSkills(q));
    }
}