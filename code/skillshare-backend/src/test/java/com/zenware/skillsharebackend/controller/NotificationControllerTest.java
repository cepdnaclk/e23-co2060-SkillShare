package com.zenware.skillsharebackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.*;
import com.zenware.skillsharebackend.service.JwtService;
import com.zenware.skillsharebackend.service.NotificationService;
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

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class NotificationControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JwtService jwtService;

    private MockMvc mockMvc;

    private User owner;
    private User unrelatedUser;
    private String ownerToken;
    private String unrelatedToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        cleanDatabase();

        owner = User.builder()
                .email("owner_notif@example.com")
                .fullName("Owner Notif")
                .password("password")
                .role(Role.USER)
                .build();
        owner = userRepository.save(owner);
        ownerToken = "Bearer " + jwtService.generateToken(owner);

        unrelatedUser = User.builder()
                .email("unrelated_notif@example.com")
                .fullName("Unrelated Notif")
                .password("password")
                .role(Role.USER)
                .build();
        unrelatedUser = userRepository.save(unrelatedUser);
        unrelatedToken = "Bearer " + jwtService.generateToken(unrelatedUser);

        // Seed notifications securely using the service method directly!
        notificationService.sendNotification(owner, "Welcome to SkillShare!", NotificationType.SYSTEM_ALERT);
        notificationService.sendNotification(owner, "Your session is approved.", NotificationType.SESSION_UPDATE);
        
        // Let's create one for the unrelated user too
        notificationService.sendNotification(unrelatedUser, "Welcome, unrelated!", NotificationType.SYSTEM_ALERT);
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        // MUST DELETE NOTIFICATIONS BEFORE USERS
        notificationRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getUserInbox_Authenticated_ReturnsOnlyOwnNotifications() throws Exception {
        mockMvc.perform(get("/api/notifications/my-inbox")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].recipient").doesNotExist()) // Sensitive field checking (recipient should be ignored or not expose password)
                .andExpect(jsonPath("$[0].message").exists());
    }

    @Test
    void getUserInbox_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/notifications/my-inbox"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUnreadCount_Authenticated_ReturnsCorrectCount() throws Exception {
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(content().string("2")); // Both are unread
    }

    @Test
    void markNotificationAsRead_Owner_Returns200AndUpdatesState() throws Exception {
        List<Notification> ownerNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(owner.getId());
        Notification target = ownerNotifs.get(0);

        mockMvc.perform(put("/api/notifications/" + target.getId() + "/read")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(content().string("Notification marked as read successfully."));

        Notification updated = notificationRepository.findById(target.getId()).orElseThrow();
        assertTrue(updated.getIsRead());

        // Check unread count dropped to 1
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(content().string("1"));
    }

    @Test
    void markNotificationAsRead_UnrelatedUser_Returns403() throws Exception {
        List<Notification> ownerNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(owner.getId());
        Notification target = ownerNotifs.get(0);

        mockMvc.perform(put("/api/notifications/" + target.getId() + "/read")
                        .header("Authorization", unrelatedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Security Violation: You cannot read someone else's notifications!")));
    }

    @Test
    void markNotificationAsRead_InvalidId_Returns400() throws Exception {
        mockMvc.perform(put("/api/notifications/00000000-0000-0000-0000-000000000000/read")
                        .header("Authorization", ownerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Notification not found")));
    }
}
