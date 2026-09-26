package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class TrendingServiceTest {
    @Test
    void allLeaderboardsPreservePictureUrlsAndMissingPictures() {
        UserRepository users = mock(UserRepository.class);
        SessionRepository sessions = mock(SessionRepository.class);
        User pictured = User.builder().id(UUID.randomUUID()).fullName("Mentor")
                .profilePictureUrl("https://res.cloudinary.com/demo/image/upload/avatar.jpg")
                .profilePicturePublicId("avatar").xp(250).reputationScore(80).build();
        User fallback = User.builder().id(UUID.randomUUID()).fullName("Learner").build();
        List<User> ranked = List.of(pictured, fallback);
        when(users.findTopMentorsByReputation(any())).thenReturn(ranked);
        when(users.findTopUsersByXp(any())).thenReturn(ranked);
        when(users.findTopMentorsByCategory(eq("Technology"), any())).thenReturn(ranked);
        TrendingService service = new TrendingService(users, sessions);
        service.refreshTrendingLists();
        for (var board : List.of(service.getTopMentors(), service.getTopActiveUsers(),
                service.getTopMentorsByCategory("Technology"))) {
            assertEquals(pictured.getId(), board.get(0).getId());
            assertEquals(pictured.getProfilePictureUrl(), board.get(0).getProfilePictureUrl());
            assertEquals(250, board.get(0).getXp());
            assertEquals(80, board.get(0).getReputationScore());
            assertNull(board.get(1).getProfilePictureUrl());
        }
    }
}
