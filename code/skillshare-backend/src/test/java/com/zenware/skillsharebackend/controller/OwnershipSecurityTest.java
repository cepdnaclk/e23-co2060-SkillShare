package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.*;
import com.zenware.skillsharebackend.service.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@ActiveProfiles("test")
public class OwnershipSecurityTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User user1;
    private User user2;
    private String token1;
    private String token2;

    private Availability user2Availability;
    private Session user2Session;
    private Notification user2Notification;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        user1 = User.builder()
                .email("user1@test.com")
                .fullName("User One")
                .role(Role.USER)
                .build();
        user1 = userRepository.save(user1);
        token1 = "Bearer " + jwtService.generateToken(user1);

        user2 = User.builder()
                .email("user2@test.com")
                .fullName("User Two")
                .role(Role.USER)
                .build();
        user2 = userRepository.save(user2);
        token2 = "Bearer " + jwtService.generateToken(user2);

        user2Availability = Availability.builder()
                .user(user2)
                .startTime(java.time.LocalDateTime.now().plusDays(1))
                .endTime(java.time.LocalDateTime.now().plusDays(1).plusHours(1))
                .build();
        user2Availability = availabilityRepository.save(user2Availability);

        Skill skill = Skill.builder().name("Test Skill").category("Test").build();
        skill = skillRepository.save(skill);

        user2Session = Session.builder()
                .learner(user2)
                .mentor(user2)
                .skill(skill)
                .startTime(java.time.LocalDateTime.now().minusDays(1))
                .endTime(java.time.LocalDateTime.now().minusDays(1).plusHours(1))
                .status(SessionStatus.COMPLETED)
                .build();
        user2Session = sessionRepository.save(user2Session);

        user2Notification = Notification.builder()
                .recipient(user2)
                .message("Test Notification")
                .type(NotificationType.SYSTEM_ALERT)
                .isRead(false)
                .build();
        user2Notification = notificationRepository.save(user2Notification);
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        sessionRepository.deleteAll();
        skillRepository.deleteAll();
        availabilityRepository.deleteAll();
        userRepository.delete(user1);
        userRepository.delete(user2);
    }

    @Test
    void accessOwnResource_Succeeds() throws Exception {
        // User1 accesses their own learner sessions
        mockMvc.perform(get("/api/sessions/learner/" + user1.getId())
                        .header("Authorization", token1))
                .andExpect(status().isOk());
    }

    @Test
    void accessOtherUserResource_Returns403() throws Exception {
        // User1 attempts to access User2's learner sessions
        mockMvc.perform(get("/api/sessions/learner/" + user2.getId())
                        .header("Authorization", token1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Access Denied"));
    }

    @Test
    void unauthenticatedAccess_Returns401() throws Exception {
        // No token provided
        mockMvc.perform(get("/api/sessions/learner/" + user1.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void modifyOtherUserAvailability_Returns403() throws Exception {
        mockMvc.perform(delete("/api/availability/" + user2Availability.getId())
                        .header("Authorization", token1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access Denied"));
    }

    @Test
    void leaveFeedbackForOtherUserSession_Returns403() throws Exception {
        String requestJson = """
            {
                "sessionId": "%s",
                "rating": 5,
                "comments": "Great",
                "selectedTags": []
            }
        """.formatted(user2Session.getId());

        mockMvc.perform(post("/api/feedback/leave")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson)
                        .header("Authorization", token1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access Denied"));
    }

    @Test
    void readOtherUserNotification_Returns403() throws Exception {
        mockMvc.perform(put("/api/notifications/" + user2Notification.getId() + "/read")
                        .header("Authorization", token1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access Denied"));
    }
}
