package com.zenware.skillsharebackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenware.skillsharebackend.dto.UserSkillRequest;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.repository.UserSkillRepository;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class UserSkillControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    @Autowired
    private JwtService jwtService;

    private ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    private User owner;
    private User unrelatedUser;
    private String ownerToken;
    private String unrelatedToken;
    private Skill existingSkill;
    private UserSkill ownerTeachSkill;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        cleanDatabase();

        owner = User.builder()
                .email("owner_skill@example.com")
                .fullName("Owner Skill")
                .password("password")
                .role(Role.USER)
                .reputationScore(0)
                .build();
        owner = userRepository.save(owner);
        ownerToken = "Bearer " + jwtService.generateToken(owner);

        unrelatedUser = User.builder()
                .email("unrelated_skill@example.com")
                .fullName("Unrelated Skill")
                .password("password")
                .role(Role.USER)
                .reputationScore(0)
                .build();
        unrelatedUser = userRepository.save(unrelatedUser);
        unrelatedToken = "Bearer " + jwtService.generateToken(unrelatedUser);

        existingSkill = Skill.builder()
                .name("Java")
                .category("Programming")
                .build();
        existingSkill = skillRepository.save(existingSkill);

        // Pre-seed a TEACH skill for owner
        UserSkillId teachId = UserSkillId.builder()
                .userId(owner.getId())
                .skillId(existingSkill.getId())
                .skillType("TEACH")
                .build();
        ownerTeachSkill = UserSkill.builder()
                .id(teachId)
                .user(owner)
                .skill(existingSkill)
                .build();
        ownerTeachSkill = userSkillRepository.save(ownerTeachSkill);
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        userSkillRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void addSkill_Teach_Returns200AndCreatesSkill() throws Exception {
        UserSkillRequest request = new UserSkillRequest();
        request.setSkillName("Spring Boot");
        request.setSkillType("TEACH");
        request.setSkillCategory("Backend");

        mockMvc.perform(post("/api/user-skills/add")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skillName").value("Spring boot"))
                .andExpect(jsonPath("$.skillType").value("TEACH"))
                .andExpect(jsonPath("$.skillCategory").value("Backend"))
                .andExpect(jsonPath("$.userId").value(owner.getId().toString()));
    }

    @Test
    void addSkill_Learn_Returns200AndLinksExistingSkill() throws Exception {
        UserSkillRequest request = new UserSkillRequest();
        request.setSkillName("Java"); // Existing skill
        request.setSkillType("LEARN");
        request.setSkillCategory("Programming");

        mockMvc.perform(post("/api/user-skills/add")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skillName").value("Java"))
                .andExpect(jsonPath("$.skillType").value("LEARN"))
                .andExpect(jsonPath("$.skillId").value(existingSkill.getId().toString()));
    }

    @Test
    void addSkill_Unauthenticated_Returns401() throws Exception {
        UserSkillRequest request = new UserSkillRequest();
        request.setSkillName("Python");
        request.setSkillType("TEACH");

        mockMvc.perform(post("/api/user-skills/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void addSkill_InvalidType_Returns400() throws Exception {
        UserSkillRequest request = new UserSkillRequest();
        request.setSkillName("Python");
        request.setSkillType("INVALID_TYPE");

        mockMvc.perform(post("/api/user-skills/add")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Must be TEACH or LEARN")));
    }

    @Test
    void addSkill_MissingName_Returns400() throws Exception {
        UserSkillRequest request = new UserSkillRequest();
        request.setSkillName("");
        request.setSkillType("TEACH");

        mockMvc.perform(post("/api/user-skills/add")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Skill name cannot be empty!")));
    }

    @Test
    void removeSkill_Owner_Returns200() throws Exception {
        mockMvc.perform(delete("/api/user-skills/remove")
                        .header("Authorization", ownerToken)
                        .param("skillId", existingSkill.getId().toString())
                        .param("skillType", "TEACH"))
                .andExpect(status().isOk())
                .andExpect(content().string("Skill removed from profile successfully."));

        // Verify it was actually deleted
        assertFalse(userSkillRepository.existsById(ownerTeachSkill.getId()));
    }

    @Test
    void removeSkill_NonExistentLink_Returns400() throws Exception {
        mockMvc.perform(delete("/api/user-skills/remove")
                        .header("Authorization", ownerToken)
                        .param("skillId", UUID.randomUUID().toString())
                        .param("skillType", "LEARN")) // Doesn't exist
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Skill linkage not found")));
    }

    @Test
    void removeSkill_UnrelatedUser_Returns400() throws Exception {
        // unrelated user tries to delete owner's skill, but the backend maps it to their OWN profile based on JWT.
        // Since unrelated user doesn't have this skill, it should return 400 not found in profile!
        mockMvc.perform(delete("/api/user-skills/remove")
                        .header("Authorization", unrelatedToken)
                        .param("skillId", existingSkill.getId().toString())
                        .param("skillType", "TEACH"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Skill linkage not found in your profile!")));
    }

    @Test
    void getUserSkills_Public_ReturnsList() throws Exception {
        mockMvc.perform(get("/api/user-skills/" + owner.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].skillName").value("Java"));
    }

    @Test
    void getUserTeachingSkills_Public_ReturnsList() throws Exception {
        mockMvc.perform(get("/api/user-skills/" + owner.getId() + "/teach"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].skillType").value("TEACH"));
    }

    @Test
    void getUserLearningSkills_Public_ReturnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/user-skills/" + owner.getId() + "/learn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getMentorsBySkill_Public_ReturnsList() throws Exception {
        mockMvc.perform(get("/api/user-skills/mentors/" + existingSkill.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId").value(owner.getId().toString()));
    }

    @Test
    void searchProfiles_ReturnsMatches() throws Exception {
        mockMvc.perform(get("/api/user-skills/search-profiles")
                        .param("name", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fullName").value("Owner Skill"));
    }
}
