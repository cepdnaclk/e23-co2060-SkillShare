package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.service.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class SessionControllerSecurityTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private User normalUser;
    private String adminToken;
    private String normalToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        adminUser = User.builder()
                .email("admin_test_sec@test.com")
                .fullName("Admin Test")
                .role(Role.ADMIN)
                .build();
        adminUser = userRepository.save(adminUser);
        adminToken = "Bearer " + jwtService.generateToken(adminUser);

        normalUser = User.builder()
                .email("user_test_sec@test.com")
                .fullName("User Test")
                .role(Role.USER)
                .build();
        normalUser = userRepository.save(normalUser);
        normalToken = "Bearer " + jwtService.generateToken(normalUser);
    }

    @AfterEach
    void tearDown() {
        userRepository.delete(adminUser);
        userRepository.delete(normalUser);
    }

    @Test
    void expireOverdueSessions_AsUser_ReturnsForbidden() throws Exception {
        mockMvc.perform(post("/api/sessions/expire-overdue")
                        .header("Authorization", normalToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void expireOverdueSessions_AsAdmin_ReturnsOk() throws Exception {
        mockMvc.perform(post("/api/sessions/expire-overdue")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void expireOverdueSessions_Unauthenticated_ReturnsRedirect() throws Exception {
        mockMvc.perform(post("/api/sessions/expire-overdue"))
                .andExpect(status().is3xxRedirection());
    }
}
