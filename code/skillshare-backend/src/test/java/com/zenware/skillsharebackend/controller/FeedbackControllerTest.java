package com.zenware.skillsharebackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenware.skillsharebackend.dto.FeedbackRequest;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class FeedbackControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CreditDebtRepository creditDebtRepository;

    @Autowired
    private JwtService jwtService;

    private ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    private User mentor;
    private User learner;
    private User unrelatedUser;
    private String mentorToken;
    private String learnerToken;
    private String unrelatedToken;
    private Session completedSession;
    private Session pendingSession;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        cleanDatabase();

        mentor = User.builder()
                .email("mentor_fb@example.com")
                .fullName("Mentor Feedback")
                .password("password")
                .role(Role.USER)
                .credits(100)
                .reputationScore(0)
                .build();
        mentor = userRepository.save(mentor);
        mentorToken = "Bearer " + jwtService.generateToken(mentor);

        learner = User.builder()
                .email("learner_fb@example.com")
                .fullName("Learner Feedback")
                .password("password")
                .role(Role.USER)
                .credits(100)
                .reputationScore(0)
                .build();
        learner = userRepository.save(learner);
        learnerToken = "Bearer " + jwtService.generateToken(learner);

        unrelatedUser = User.builder()
                .email("unrelated_fb@example.com")
                .fullName("Unrelated User")
                .password("password")
                .role(Role.USER)
                .credits(100)
                .reputationScore(0)
                .build();
        unrelatedUser = userRepository.save(unrelatedUser);
        unrelatedToken = "Bearer " + jwtService.generateToken(unrelatedUser);

        Skill skill = Skill.builder().name("Feedback Skill").build();
        skill = skillRepository.save(skill);

        Availability availability = Availability.builder()
                .user(mentor)
                .startTime(LocalDateTime.now().minusDays(1))
                .endTime(LocalDateTime.now().minusDays(1).plusHours(1))
                .isBooked(true)
                .build();
        availability = availabilityRepository.save(availability);

        completedSession = new Session();
        completedSession.setLearner(learner);
        completedSession.setMentor(mentor);
        completedSession.setSkill(skill);
        completedSession.setAvailabilityId(availability.getId());
        completedSession.setStartTime(availability.getStartTime());
        completedSession.setEndTime(availability.getEndTime());
        completedSession.setStatus(SessionStatus.COMPLETED);
        completedSession.setCreditValue(10);
        completedSession = sessionRepository.save(completedSession);

        pendingSession = new Session();
        pendingSession.setLearner(learner);
        pendingSession.setMentor(mentor);
        pendingSession.setSkill(skill);
        pendingSession.setAvailabilityId(availability.getId());
        pendingSession.setStartTime(LocalDateTime.now().plusDays(1));
        pendingSession.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        pendingSession.setStatus(SessionStatus.PENDING);
        pendingSession.setCreditValue(10);
        pendingSession = sessionRepository.save(pendingSession);
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        feedbackRepository.deleteAll();
        creditDebtRepository.deleteAll();
        notificationRepository.deleteAll();
        sessionRepository.deleteAll();
        availabilityRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void submitFeedback_Valid_Returns200AndUpdatesReputation() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setSessionId(completedSession.getId());
        request.setSelectedTags(List.of("DEEP_KNOWLEDGE", "FRIENDLY"));

        mockMvc.perform(post("/api/feedback/leave")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.giverId").value(learner.getId().toString()))
                .andExpect(jsonPath("$.receiverId").value(mentor.getId().toString()));

        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        assertTrue(updatedMentor.getReputationScore() > 0);
    }

    @Test
    void submitFeedback_Unauthenticated_Returns401() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setSessionId(completedSession.getId());
        request.setSelectedTags(List.of("DEEP_KNOWLEDGE"));

        mockMvc.perform(post("/api/feedback/leave")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void submitFeedback_PendingSession_Returns409() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setSessionId(pendingSession.getId());
        request.setSelectedTags(List.of("DEEP_KNOWLEDGE"));

        mockMvc.perform(post("/api/feedback/leave")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("COMPLETED sessions")));
    }

    @Test
    void submitFeedback_UnrelatedUser_Returns403() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setSessionId(completedSession.getId());
        request.setSelectedTags(List.of("DEEP_KNOWLEDGE"));

        mockMvc.perform(post("/api/feedback/leave")
                        .header("Authorization", unrelatedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("not a participant")));
    }

    @Test
    void submitFeedback_Duplicate_Returns409() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setSessionId(completedSession.getId());
        request.setSelectedTags(List.of("DEEP_KNOWLEDGE"));

        mockMvc.perform(post("/api/feedback/leave")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        long initialCount = feedbackRepository.count();

        mockMvc.perform(post("/api/feedback/leave")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already left feedback")));

        org.junit.jupiter.api.Assertions.assertEquals(initialCount, feedbackRepository.count());
    }

    @Test
    void submitFeedback_InvalidTagFormat_Returns400() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setSessionId(completedSession.getId());
        request.setSelectedTags(List.of("INVALID_TAG_XYZ"));

        mockMvc.perform(post("/api/feedback/leave")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid feedback tag")));
    }

    @Test
    void getUserFeedback_Public_ReturnsList() throws Exception {
        // Setup initial feedback
        FeedbackRequest request = new FeedbackRequest();
        request.setSessionId(completedSession.getId());
        request.setSelectedTags(List.of("DEEP_KNOWLEDGE"));
        
        mockMvc.perform(post("/api/feedback/leave")
                .header("Authorization", learnerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/feedback/user/" + mentor.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].receiverId").value(mentor.getId().toString()));
    }

    @Test
    void getAvailableTags_Public_ReturnsList() throws Exception {
        mockMvc.perform(get("/api/feedback/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[0].name").exists());
    }
}
