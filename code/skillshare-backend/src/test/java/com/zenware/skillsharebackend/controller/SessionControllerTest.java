package com.zenware.skillsharebackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
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
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class SessionControllerTest {

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
    private JwtService jwtService;

    @Autowired
    private com.zenware.skillsharebackend.repository.NotificationRepository notificationRepository;

    @Autowired
    private com.zenware.skillsharebackend.repository.CreditDebtRepository creditDebtRepository;

    private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private MockMvc mockMvc;

    private User mentor;
    private User learner;
    private User unrelatedUser;
    private String mentorToken;
    private String learnerToken;
    private String unrelatedToken;
    private Skill skill;
    private Availability availability;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        creditDebtRepository.deleteAll();
        notificationRepository.deleteAll();
        sessionRepository.deleteAll();
        availabilityRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();

        mentor = User.builder()
                .email("mentor_session@example.com")
                .fullName("Mentor Session")
                .password("password")
                .role(Role.USER)
                .credits(100)
                .build();
        mentor = userRepository.save(mentor);
        mentorToken = "Bearer " + jwtService.generateToken(mentor);

        learner = User.builder()
                .email("learner_session@example.com")
                .fullName("Learner Session")
                .password("password")
                .role(Role.USER)
                .credits(100)
                .build();
        learner = userRepository.save(learner);
        learnerToken = "Bearer " + jwtService.generateToken(learner);

        unrelatedUser = User.builder()
                .email("unrelated_session@example.com")
                .fullName("Unrelated User")
                .password("password")
                .role(Role.USER)
                .credits(100)
                .build();
        unrelatedUser = userRepository.save(unrelatedUser);
        unrelatedToken = "Bearer " + jwtService.generateToken(unrelatedUser);

        skill = Skill.builder()
                .name("Java Backend")
                .build();
        skill = skillRepository.save(skill);

        availability = Availability.builder()
                .user(mentor)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .isBooked(false)
                .build();
        availability = availabilityRepository.save(availability);
    }

    @AfterEach
    void tearDown() {
        creditDebtRepository.deleteAll();
        notificationRepository.deleteAll();
        sessionRepository.deleteAll();
        availabilityRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();
    }

    // --- Booking ---
    @Test
    void bookSession_Authenticated_Returns200AndCreatesSession() throws Exception {
        SessionRequest request = new SessionRequest();
        request.setSkillId(skill.getId());
        request.setAvailabilityId(availability.getId());

        mockMvc.perform(post("/api/sessions/book")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.mentorId").value(mentor.getId().toString()));
                
        // Check credit deduction
        User updatedLearner = userRepository.findById(learner.getId()).orElseThrow();
        assertEquals(90, updatedLearner.getCredits()); // 100 - 10
    }

    @Test
    void bookSession_Unauthenticated_Returns401() throws Exception {
        SessionRequest request = new SessionRequest();
        request.setSkillId(skill.getId());
        request.setAvailabilityId(availability.getId());

        mockMvc.perform(post("/api/sessions/book")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bookSession_InsufficientCredits_Returns409() throws Exception {
        learner.setCredits(5);
        userRepository.save(learner);

        SessionRequest request = new SessionRequest();
        request.setSkillId(skill.getId());
        request.setAvailabilityId(availability.getId());

        mockMvc.perform(post("/api/sessions/book")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("You do not have enough credits")));
    }

    @Test
    void bookSession_BookOwnSlot_Returns400() throws Exception {
        SessionRequest request = new SessionRequest();
        request.setSkillId(skill.getId());
        request.setAvailabilityId(availability.getId());

        mockMvc.perform(post("/api/sessions/book")
                        .header("Authorization", mentorToken) // mentor booking own slot
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You cannot book your own time slot!"));
    }

    @Test
    void bookSession_InvalidAvailability_Returns400() throws Exception {
        SessionRequest request = new SessionRequest();
        request.setSkillId(skill.getId());
        request.setAvailabilityId(UUID.randomUUID());

        mockMvc.perform(post("/api/sessions/book")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Time slot not found"));
    }

    // --- Status ---
    @Test
    void updateStatus_MentorAccepts_Returns200() throws Exception {
        Session session = createPendingSession();

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/status")
                        .header("Authorization", mentorToken)
                        .param("status", "ACCEPTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    void updateStatus_MentorRejects_Returns200AndRefunds() throws Exception {
        Session session = createPendingSession();

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/status")
                        .header("Authorization", mentorToken)
                        .param("status", "REJECTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        User updatedLearner = userRepository.findById(learner.getId()).orElseThrow();
        assertEquals(100, updatedLearner.getCredits()); // Refunded
    }

    @Test
    void updateStatus_UnauthorizedUser_Returns403() throws Exception {
        Session session = createPendingSession();

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/status")
                        .header("Authorization", learnerToken) // Learner cannot accept
                        .param("status", "ACCEPTED"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Security Violation: Only the assigned mentor can update this session!")));
    }
    
    @Test
    void updateStatus_InvalidStatus_Returns400() throws Exception {
        Session session = createPendingSession();

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/status")
                        .header("Authorization", mentorToken)
                        .param("status", "COMPLETED")) // COMPLETED is not valid here
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid target status"));
    }

    // --- Cancellation ---
    @Test
    void cancelSession_LearnerCancelsPending_Returns200AndRefunds() throws Exception {
        Session session = createPendingSession();

        mockMvc.perform(put("/api/sessions/" + session.getId() + "/cancel")
                        .header("Authorization", learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        User updatedLearner = userRepository.findById(learner.getId()).orElseThrow();
        assertEquals(100, updatedLearner.getCredits()); // Full refund
    }

    @Test
    void cancelSession_MentorCancelsAccepted_Returns200AndPenalizes() throws Exception {
        Session session = createPendingSession();
        session.setStatus(SessionStatus.ACCEPTED);
        sessionRepository.save(session);
        // learner is at 90 right now.
        
        mockMvc.perform(put("/api/sessions/" + session.getId() + "/cancel")
                        .header("Authorization", mentorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        User updatedLearner = userRepository.findById(learner.getId()).orElseThrow();
        assertEquals(95, updatedMentor.getCredits()); // -5 penalty
        assertEquals(105, updatedLearner.getCredits()); // 10 original + 5 compensation, previous was 90
    }

    @Test
    void cancelSession_UnrelatedUser_Returns403() throws Exception {
        Session session = createPendingSession();

        mockMvc.perform(put("/api/sessions/" + session.getId() + "/cancel")
                        .header("Authorization", unrelatedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Security Violation")));
    }

    // --- Completion ---
    @Test
    void completeSession_LearnerCompletesAccepted_Returns200() throws Exception {
        Session session = createPendingSession();
        session.setStatus(SessionStatus.ACCEPTED);
        session.setStartTime(LocalDateTime.now().minusHours(2));
        session.setEndTime(LocalDateTime.now().minusHours(1));
        sessionRepository.save(session);

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/complete")
                        .header("Authorization", learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void completeSession_MentorCannotComplete_Returns403() throws Exception {
        Session session = createPendingSession();
        session.setStatus(SessionStatus.ACCEPTED);
        session.setStartTime(LocalDateTime.now().minusHours(2));
        session.setEndTime(LocalDateTime.now().minusHours(1));
        sessionRepository.save(session);

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/complete")
                        .header("Authorization", mentorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Security Violation: Only the Learner can complete the session!")));
    }

    @Test
    void completeSession_NotAccepted_Returns409() throws Exception {
        Session session = createPendingSession(); // PENDING

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/complete")
                        .header("Authorization", learnerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Only ACCEPTED sessions can be marked as COMPLETED!"));
    }

    // --- Meeting Link ---
    @Test
    void addMeetingLink_MentorAdds_Returns200() throws Exception {
        Session session = createPendingSession();

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/meeting-link")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("meetingLink", "https://zoom.us/j/123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingLink").value("https://zoom.us/j/123"));
    }

    @Test
    void addMeetingLink_LearnerCannotAdd_Returns403() throws Exception {
        Session session = createPendingSession();

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/meeting-link")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("meetingLink", "https://zoom.us/j/123"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Access Denied")));
    }

    // --- Retrieval ---
    @Test
    void getMyClasses_Learner_ReturnsList() throws Exception {
        createPendingSession();

        mockMvc.perform(get("/api/sessions/learner/" + learner.getId())
                        .header("Authorization", learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void getMyClasses_UnrelatedUser_Returns403() throws Exception {
        createPendingSession();

        mockMvc.perform(get("/api/sessions/learner/" + learner.getId())
                        .header("Authorization", unrelatedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Security Violation: You can only view your own classes!")));
    }

    @Test
    void getMyTeachingSchedule_Mentor_ReturnsList() throws Exception {
        createPendingSession();

        mockMvc.perform(get("/api/sessions/mentor/" + mentor.getId())
                        .header("Authorization", mentorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    private Session createPendingSession() {
        learner.setCredits(90);
        userRepository.save(learner);

        Session session = new Session();
        session.setLearner(learner);
        session.setMentor(mentor);
        session.setSkill(skill);
        session.setAvailabilityId(availability.getId());
        session.setStartTime(availability.getStartTime());
        session.setEndTime(availability.getEndTime());
        session.setStatus(SessionStatus.PENDING);
        session.setCreditValue(10);
        session = sessionRepository.saveAndFlush(session);

        availability.setIsBooked(true);
        availability.setActiveSessionId(session.getId());
        availabilityRepository.saveAndFlush(availability);

        return session;
    }
}
