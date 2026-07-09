package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.TrendingSkillDto;
import com.zenware.skillsharebackend.dto.UserPublicDto;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrendingService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;

    // --- IN-MEMORY CACHES ---
    private List<UserPublicDto> cachedTopMentors = new ArrayList<>();
    private List<UserPublicDto> cachedTopActiveUsers = new ArrayList<>();
    private List<TrendingSkillDto> cachedTopSharingSkills = new ArrayList<>();

    /**
     * Runs immediately when the Spring Boot server boots up.
     */
    @PostConstruct
    public void init() {
        refreshTrendingLists();
    }

    /**
     * Background task: Refreshes the cache every 10 minutes (600,000 ms).
     */
    @Scheduled(fixedRate = 600000)
    public void refreshTrendingLists() {
        System.out.println("⏳ Background Task: Refreshing Trending Leaderboards...");

        // 1. Refresh Top Mentors (Grabs exactly 10)
        this.cachedTopMentors = userRepository.findTopMentorsByReputation(PageRequest.of(0, 10))
                .stream()
                .map(this::mapToPublicDto)
                .collect(Collectors.toList());

        // 2. Refresh Top Active Users (Grabs exactly 10)
        this.cachedTopActiveUsers = userRepository.findTopUsersByXp(PageRequest.of(0, 10))
                .stream()
                .map(this::mapToPublicDto)
                .collect(Collectors.toList());

        // 3. Refresh Top Sharing Skills
        // (Assuming sessionRepository.findTopTrendingSkills handles its own limit or takes a Pageable too)
        this.cachedTopSharingSkills = sessionRepository.findTopTrendingSkills(10);

        System.out.println("✅ Background Task: Leaderboards refreshed successfully.");
    }

    // --- ZERO-LATENCY CACHED ENDPOINTS ---

    public List<UserPublicDto> getTopMentors() {
        return this.cachedTopMentors;
    }

    public List<UserPublicDto> getTopActiveUsers() {
        return this.cachedTopActiveUsers;
    }

    public List<TrendingSkillDto> getTopSharingSkills() {
        return this.cachedTopSharingSkills;
    }

    // --- DYNAMIC ENDPOINT (Calculated live based on user input) ---

    public List<UserPublicDto> getTopMentorsByCategory(String category) {
        // Because the category string is dynamic, we query the DB live using Pageable
        return userRepository.findTopMentorsByCategory(category, PageRequest.of(0, 10))
                .stream()
                .map(this::mapToPublicDto)
                .collect(Collectors.toList());
    }

    // --- HELPER MAPPING ---

    private UserPublicDto mapToPublicDto(User user) {
        return UserPublicDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .xp(user.getXp() != null ? user.getXp() : 0)
                .level(user.getLevel() != null ? user.getLevel() : 1)
                .reputationScore(user.getReputationScore() != null ? user.getReputationScore() : 0)
                .build();
    }
}