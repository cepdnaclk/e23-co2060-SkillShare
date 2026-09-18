package com.zenware.skillsharebackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenware.skillsharebackend.dto.AuthenticationRequest;
import com.zenware.skillsharebackend.dto.RegisterRequest;
import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.service.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class AuthenticationControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User existingUser;
    private String rawPassword = "password123";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        userRepository.deleteAll();

        existingUser = new User();
        existingUser.setFullName("Existing User");
        existingUser.setEmail("existing@example.com");
        existingUser.setPassword(passwordEncoder.encode(rawPassword));
        existingUser.setRole(Role.USER);
        existingUser.setCredits(100);
        existingUser = userRepository.save(existingUser);
    }

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    // --- REGISTRATION TESTS ---

    @Test
    void register_ValidRequest_Returns200AndToken() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("New User");
        request.setEmail("new@example.com");
        request.setPassword("strongPassword1!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value("new@example.com"))
                .andExpect(jsonPath("$.fullName").value("New User"));

        User savedUser = userRepository.findByEmail("new@example.com").orElseThrow();
        assertNotEquals("strongPassword1!", savedUser.getPassword());
        assertTrue(passwordEncoder.matches("strongPassword1!", savedUser.getPassword()));
    }

    @Test
    void register_DuplicateEmail_Returns400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Another User");
        request.setEmail("existing@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid Request"))
                .andExpect(jsonPath("$.message").value("Email is already taken!"));
    }

    @Test
    void register_MissingFields_Returns400() throws Exception {
        RegisterRequest request = new RegisterRequest();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // --- LOGIN TESTS ---

    @Test
    void login_ValidCredentials_Returns200AndToken() throws Exception {
        AuthenticationRequest request = new AuthenticationRequest();
        request.setEmail("existing@example.com");
        request.setPassword(rawPassword);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value("existing@example.com"));
    }

    @Test
    void login_WrongPassword_Returns400() throws Exception {
        AuthenticationRequest request = new AuthenticationRequest();
        request.setEmail("existing@example.com");
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Logic Violation"))
                .andExpect(jsonPath("$.message").value("Bad credentials"));
    }

    @Test
    void login_UnknownEmail_Returns400() throws Exception {
        AuthenticationRequest request = new AuthenticationRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Logic Violation"))
                .andExpect(jsonPath("$.message").value("Bad credentials"));
    }

    @Test
    void login_MissingFields_Returns400() throws Exception {
        AuthenticationRequest request = new AuthenticationRequest();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_MalformedRequest_Returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{malformed json"))
                .andExpect(status().isBadRequest());
    }

    // --- /api/users/me TESTS ---

    @Test
    void getMe_Authenticated_Returns200AndDoesNotExposeSensitiveFields() throws Exception {
        String token = "Bearer " + jwtService.generateToken(existingUser);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("existing@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void getMe_MissingJwt_Returns401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMe_MalformedJwt_Returns401() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer invalidtoken"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMe_InvalidUser_Returns401() throws Exception {
        User deletedUser = new User();
        deletedUser.setEmail("deleted@example.com");
        deletedUser.setId(java.util.UUID.randomUUID());
        String token = "Bearer " + jwtService.generateToken(deletedUser);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", token))
                .andExpect(status().isUnauthorized());
    }
}
