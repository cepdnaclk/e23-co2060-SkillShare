package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.TrendingSkillDto;
import com.zenware.skillsharebackend.dto.UserPublicDto;
import com.zenware.skillsharebackend.service.TrendingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trending")
@RequiredArgsConstructor
public class TrendingController {

    private final TrendingService trendingService;

    @GetMapping("/mentors")
    public ResponseEntity<List<UserPublicDto>> getTopMentors() {
        return ResponseEntity.ok(trendingService.getTopMentors());
    }

    @GetMapping("/mentors/category/{category}")
    public ResponseEntity<List<UserPublicDto>> getTopMentorsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(trendingService.getTopMentorsByCategory(category));
    }

    @GetMapping("/learners")
    public ResponseEntity<List<UserPublicDto>> getTopActiveUsers() {
        return ResponseEntity.ok(trendingService.getTopActiveUsers());
    }

    @GetMapping("/skills")
    public ResponseEntity<List<TrendingSkillDto>> getTopSharingSkills() {
        return ResponseEntity.ok(trendingService.getTopSharingSkills());
    }
}