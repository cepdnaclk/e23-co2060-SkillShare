package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.TrendingSkillDto;
import com.zenware.skillsharebackend.dto.UserPublicDto;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrendingService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;

    // Helper method to convert Entity -> DTO
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

    public List<UserPublicDto> getTopMentors() {
        return userRepository.findTopMentorsByReputation(10)
                .stream()
                .map(this::mapToPublicDto)
                .collect(Collectors.toList());
    }

    public List<UserPublicDto> getTopMentorsByCategory(String category) {
        return userRepository.findTopMentorsByCategory(category, 10)
                .stream()
                .map(this::mapToPublicDto)
                .collect(Collectors.toList());
    }

    public List<UserPublicDto> getTopActiveUsers() {
        return userRepository.findTopUsersByXp(10)
                .stream()
                .map(this::mapToPublicDto)
                .collect(Collectors.toList());
    }

    public List<TrendingSkillDto> getTopSharingSkills() {
        return sessionRepository.findTopTrendingSkills(10);
    }
}