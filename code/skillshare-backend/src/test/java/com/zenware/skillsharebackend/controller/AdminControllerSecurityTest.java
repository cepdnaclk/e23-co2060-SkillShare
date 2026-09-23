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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AdminControllerSecurityTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private MockMvc mockMvc;
    private User normalUser;
    private User adminUser;
    private String normalToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        userRepository.deleteAll();

        normalUser = userRepository.save(User.builder()
                .email("normal_admin_security@example.com")
                .fullName("Normal User")
                .role(Role.USER)
                .build());
        adminUser = userRepository.save(User.builder()
                .email("admin_security@example.com")
                .fullName("Admin User")
                .role(Role.ADMIN)
                .build());

        normalToken = "Bearer " + jwtService.generateToken(normalUser);
        adminToken = "Bearer " + jwtService.generateToken(adminUser);
    }

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    @Test
    void overview_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void overview_NormalUser_Returns403() throws Exception {
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", normalToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void overview_Admin_Returns200() throws Exception {
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(2));
    }
}
