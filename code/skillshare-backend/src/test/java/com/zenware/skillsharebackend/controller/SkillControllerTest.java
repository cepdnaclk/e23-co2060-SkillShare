package com.zenware.skillsharebackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.Skill;
import com.zenware.skillsharebackend.entity.User;
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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class SkillControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    private User authUser;
    private String authToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        skillRepository.deleteAll();
        userRepository.deleteAll();

        authUser = User.builder()
                .email("skilluser@example.com")
                .fullName("Skill User")
                .password("password")
                .role(Role.USER)
                .build();
        authUser = userRepository.save(authUser);
        authToken = "Bearer " + jwtService.generateToken(authUser);
    }

    @AfterEach
    void tearDown() {
        skillRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void searchSkills_PublicAccess_ReturnsOk() throws Exception {
        Skill skill = Skill.builder().name("Java Programming").build();
        skillRepository.save(skill);

        mockMvc.perform(get("/api/skills/search?q=Java"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Java Programming"));
    }

    @Test
    void addSkill_Unauthenticated_Returns401() throws Exception {
        String skillJson = "{\"name\":\"Spring Boot\"}";

        mockMvc.perform(post("/api/skills/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(skillJson))
                .andExpect(status().isUnauthorized()); // or 403
    }

    @Test
    void addSkill_Authenticated_ReturnsOk() throws Exception {
        String skillJson = "{\"name\":\"Spring boot\"}";

        mockMvc.perform(post("/api/skills/add")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(skillJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Spring boot"));
    }
}
