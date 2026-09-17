package com.zenware.skillsharebackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.entity.Availability;
import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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

    private MockMvc mockMvc;

    private User mentor;
    private User otherUser;
    private String mentorToken;
    private String otherUserToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        availabilityRepository.deleteAll();
        userRepository.deleteAll();

        mentor = User.builder()
                .email("mentor_avail@example.com")
                .fullName("Mentor Avail")
                .password("password")
                .role(Role.USER)
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
    }

    @AfterEach
    void tearDown() {
        availabilityRepository.deleteAll();
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
                .andExpect(jsonPath("$.startTime").exists())
                .andExpect(jsonPath("$.endTime").exists());
                
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
                .andExpect(jsonPath("$.message").value("Start time must be before end time!"));
    }

    @Test
    void addAvailability_MissingFields_Returns400() throws Exception {
        // Missing start and end times
        String jsonPayload = "{}";

        mockMvc.perform(post("/api/availability/add")
                        .header("Authorization", mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest());
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
}
