package com.zenware.skillsharebackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.entity.Availability;
import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.NotificationRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.repository.CreditDebtRepository;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

@SpringBootTest
@ActiveProfiles("test")
public class AvailabilityControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CreditDebtRepository creditDebtRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private User mentor;
    private User otherUser;
    private User learner;
    private Skill skill;
    private String mentorToken;
    private String otherUserToken;
    private String learnerToken;

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
                .email("mentor_avail@example.com")
                .fullName("Mentor Avail")
                .password("password")
                .role(Role.USER)
                .credits(100)
                .build();
        mentor = userRepository.save(mentor);
        mentorToken = "Bearer " + jwtService.generateToken(mentor);

        otherUser = User.builder()
                .email("other_avail@example.com")
                .fullName("Other User")
                .password("password")
                .role(Role.USER)
                .build();
        otherUser = userRepository.save(otherUser);
        otherUserToken = "Bearer " + jwtService.generateToken(otherUser);

        learner = User.builder()
                .email("learner_avail@example.com")
                .fullName("Learner Avail")
                .password("password")
                .role(Role.USER)
                .credits(100)
                .build();
        learner = userRepository.save(learner);
        learnerToken = "Bearer " + jwtService.generateToken(learner);

        skill = Skill.builder()
                .name("Test Skill")
                .build();
        skill = skillRepository.save(skill);
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

    @Test
    void addAvailability_Authenticated_Returns200() throws Exception {
        String start = LocalDateTime.now().plusDays(1).withNano(0).toString();
        String end = LocalDateTime.now().plusDays(1).plusHours(1).withNano(0).toString();
        String jsonPayload = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start, end);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.mentorId").exists()) // DTO property
                .andExpect(jsonPath("$.user").doesNotExist()) // Proof entity is not leaked
                .andExpect(jsonPath("$.startTime").exists())
                .andExpect(jsonPath("$.endTime").exists())
                .andExpect(jsonPath("$.isBooked").value(false));

        assertFalse(availabilityRepository.findAll().isEmpty());
    }

    @Test
    void addAvailability_Unauthenticated_Returns401() throws Exception {
        String start = LocalDateTime.now().plusDays(1).withNano(0).toString();
        String end = LocalDateTime.now().plusDays(1).plusHours(1).withNano(0).toString();
        String jsonPayload = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start, end);

        mockMvc.perform(post("/api/availability/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void addAvailability_StartAfterEnd_Returns400() throws Exception {
        String start = LocalDateTime.now().plusDays(1).plusHours(2).withNano(0).toString();
        String end = LocalDateTime.now().plusDays(1).plusHours(1).withNano(0).toString(); // End before start
        String jsonPayload = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start, end);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Start time must be strictly before end time!"));
    }

    @Test
    void addAvailability_MissingFields_Returns400() throws Exception {
        // Missing start and end times
        String jsonPayload = "{}";

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));
    }

    @Test
    void addAvailability_ZeroDuration_Returns400() throws Exception {
        String sameTime = LocalDateTime.now().plusDays(1).withNano(0).toString();
        String jsonPayload = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", sameTime, sameTime);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Start time must be strictly before end time!"));

        assertTrue(availabilityRepository.findAll().isEmpty());
    }

    @Test
    void addAvailability_PastTime_Returns400() throws Exception {
        String start = LocalDateTime.now().minusDays(1).withNano(0).toString();
        String end = LocalDateTime.now().minusDays(1).plusHours(1).withNano(0).toString();
        String jsonPayload = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start, end);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Start time cannot be in the past!"));

        assertTrue(availabilityRepository.findAll().isEmpty());
    }

    @Test
    void addAvailability_Duplicate_Returns409() throws Exception {
        String start = LocalDateTime.now().plusDays(1).withNano(0).toString();
        String end = LocalDateTime.now().plusDays(1).plusHours(1).withNano(0).toString();
        String jsonPayload = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start, end);

        // First succeeds
        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk());

        // Second duplicate fails
        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Time slot overlaps with existing availability!"));

        assertEquals(1, availabilityRepository.findAll().size());
    }

    @Test
    void addAvailability_Overlapping_Returns409() throws Exception {
        // Existing: 10:00 - 11:00
        String start1 = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withNano(0).toString();
        String end1 = LocalDateTime.now().plusDays(1).withHour(11).withMinute(0).withNano(0).toString();
        String payload1 = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start1, end1);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload1))
                .andExpect(status().isOk());

        // New: 10:30 - 11:30 (Partial overlap)
        String start2 = LocalDateTime.now().plusDays(1).withHour(10).withMinute(30).withNano(0).toString();
        String end2 = LocalDateTime.now().plusDays(1).withHour(11).withMinute(30).withNano(0).toString();
        String payload2 = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start2, end2);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload2))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Time slot overlaps with existing availability!"));

        assertEquals(1, availabilityRepository.findAll().size());
    }

    @Test
    void addAvailability_Contained_Returns409() throws Exception {
        // Existing: 10:00 - 12:00
        String start1 = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withNano(0).toString();
        String end1 = LocalDateTime.now().plusDays(1).withHour(12).withMinute(0).withNano(0).toString();
        String payload1 = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start1, end1);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload1))
                .andExpect(status().isOk());

        // New: 10:30 - 11:00 (Full containment)
        String start2 = LocalDateTime.now().plusDays(1).withHour(10).withMinute(30).withNano(0).toString();
        String end2 = LocalDateTime.now().plusDays(1).withHour(11).withMinute(0).withNano(0).toString();
        String payload2 = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start2, end2);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload2))
                .andExpect(status().isConflict());

        assertEquals(1, availabilityRepository.findAll().size());
    }

    @Test
    void addAvailability_Adjacent_Returns200() throws Exception {
        // Existing: 10:00 - 11:00
        String start1 = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withNano(0).toString();
        String end1 = LocalDateTime.now().plusDays(1).withHour(11).withMinute(0).withNano(0).toString();
        String payload1 = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start1, end1);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload1))
                .andExpect(status().isOk());

        // New: 11:00 - 12:00 (Adjacent)
        String start2 = LocalDateTime.now().plusDays(1).withHour(11).withMinute(0).withNano(0).toString();
        String end2 = LocalDateTime.now().plusDays(1).withHour(12).withMinute(0).withNano(0).toString();
        String payload2 = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start2, end2);

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload2))
                .andExpect(status().isOk());

        assertEquals(2, availabilityRepository.findAll().size());
        for (Availability a : availabilityRepository.findAll()) {
            assertFalse(a.getIsBooked());
        }
    }

    @Test
    void getMyAvailabilities_Authenticated_ReturnsList() throws Exception {
        Availability avail = Availability.builder()
                .user(mentor)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .isBooked(false)
                .build();
        availabilityRepository.save(avail);

        mockMvc.perform(get("/api/availability/my-slots")
                        .header("Authorization", mentorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(avail.getId().toString()));
    }

    @Test
    void getMentorFreeSlots_ReturnsList() throws Exception {
        Availability avail = Availability.builder()
                .user(mentor)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .isBooked(false)
                .build();
        availabilityRepository.save(avail);

        mockMvc.perform(get("/api/availability/mentor/" + mentor.getId())
                        .header("Authorization", otherUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void deleteAvailability_Owner_Returns200() throws Exception {
        Availability avail = Availability.builder()
                .user(mentor)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .isBooked(false)
                .build();
        avail = availabilityRepository.save(avail);

        mockMvc.perform(delete("/api/availability/" + avail.getId())
                        .header("Authorization", mentorToken))
                .andExpect(status().isOk());

        assertTrue(availabilityRepository.findById(avail.getId()).isEmpty());
    }

    @Test
    void deleteAvailability_OtherUser_Returns403() throws Exception {
        Availability avail = Availability.builder()
                .user(mentor)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .isBooked(false)
                .build();
        avail = availabilityRepository.save(avail);

        mockMvc.perform(delete("/api/availability/" + avail.getId())
                        .header("Authorization", otherUserToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Security Violation: You can only delete your own availability!")));
    }

    @Test
    void deleteAvailability_BookedSlot_Returns409() throws Exception {
        Availability avail = Availability.builder()
                .user(mentor)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .isBooked(true) // Booked
                .build();
        avail = availabilityRepository.save(avail);

        mockMvc.perform(delete("/api/availability/" + avail.getId())
                        .header("Authorization", mentorToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("You cannot delete a slot that is already booked!"));
    }

    @Test
    void deleteAvailability_MissingId_Returns400() throws Exception {
        mockMvc.perform(delete("/api/availability/" + UUID.randomUUID())
                        .header("Authorization", mentorToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Time slot not found"));
    }

    @Test
    void deleteAvailability_AfterSessionCancelled_Returns200() throws Exception {
        // 3. Mentor creates an availability slot
        String start = LocalDateTime.now().plusDays(1).withNano(0).toString();
        String end = LocalDateTime.now().plusDays(1).plusHours(1).withNano(0).toString();
        String jsonPayload = String.format("{\"startTime\":\"%s\",\"endTime\":\"%s\"}", start, end);

        String availResponse = mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String availId = objectMapper.readTree(availResponse).get("id").asText();
        Availability avail = availabilityRepository.findById(UUID.fromString(availId)).orElseThrow();

        // 4. Learner books the slot
        SessionRequest bookingRequest = new SessionRequest();
        bookingRequest.setSkillId(skill.getId());
        bookingRequest.setAvailabilityId(avail.getId());

        String bookResponse = mockMvc.perform(post("/api/sessions/book")
                        .header("Authorization", learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        UUID sessionId = UUID.fromString(objectMapper.readTree(bookResponse).get("id").asText());

        // 5. Verify the slot is booked
        Availability bookedAvail = availabilityRepository.findById(avail.getId()).orElseThrow();
        assertTrue(bookedAvail.getIsBooked());

        // 7. Authenticate as mentor and cancel the session
        mockMvc.perform(put("/api/sessions/" + sessionId + "/cancel")
                        .header("Authorization", mentorToken))
                .andExpect(status().isOk());

        // 8. Verify Learner refund and Availability state
        User updatedLearner = userRepository.findById(learner.getId()).orElseThrow();
        assertEquals(100, updatedLearner.getCredits()); // Orig 100 -> booked (90) -> cancelled (100)

        Availability freedAvail = availabilityRepository.findById(avail.getId()).orElseThrow();
        assertFalse(freedAvail.getIsBooked());

        // 9. Delete the now-released availability slot
        mockMvc.perform(delete("/api/availability/" + avail.getId())
                        .header("Authorization", mentorToken))
                .andExpect(status().isOk());

        // 10. Verify deletion
        assertTrue(availabilityRepository.findById(avail.getId()).isEmpty());
    }
}
