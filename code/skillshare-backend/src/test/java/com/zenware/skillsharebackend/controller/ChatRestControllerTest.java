package com.zenware.skillsharebackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenware.skillsharebackend.entity.ChatMessage;
import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.ChatMessageRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class ChatRestControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private JwtService jwtService;

    private ObjectMapper objectMapper = new ObjectMapper();

    private User user1;
    private User user2;
    private User unrelatedUser;
    
    private String user1Token;
    private String user2Token;
    private String unrelatedToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        // Create persisted users
        user1 = userRepository.save(User.builder()
                .email("chat1@test.com")
                .password("password")
                .fullName("Chat User 1")
                .role(Role.USER)
                .build());

        user2 = userRepository.save(User.builder()
                .email("chat2@test.com")
                .password("password")
                .fullName("Chat User 2")
                .role(Role.USER)
                .build());

        unrelatedUser = userRepository.save(User.builder()
                .email("chat3@test.com")
                .password("password")
                .fullName("Unrelated User")
                .role(Role.USER)
                .build());

        user1Token = "Bearer " + jwtService.generateToken(user1);
        user2Token = "Bearer " + jwtService.generateToken(user2);
        unrelatedToken = "Bearer " + jwtService.generateToken(unrelatedUser);
    }

    @AfterEach
    void tearDown() {
        // Safe database teardown order
        chatMessageRepository.deleteAll();
        userRepository.deleteAll();
    }

    // --- HISTORY TESTS ---

    @Test
    void getHistory_Authenticated_ReturnsHistory() throws Exception {
        // Create some messages
        chatMessageRepository.save(ChatMessage.builder()
                .sender(user1).receiver(user2).content("Hello 1").isRead(true).build());
        Thread.sleep(100);
        chatMessageRepository.save(ChatMessage.builder()
                .sender(user2).receiver(user1).content("Hello 2").isRead(false).build());
        
        mockMvc.perform(get("/api/chat/history/" + user2.getId())
                        .header("Authorization", user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                // Verify explicitly DESC ordering (newest first)
                .andExpect(jsonPath("$.content[0].content").value("Hello 2"))
                .andExpect(jsonPath("$.content[1].content").value("Hello 1"))
                // Verify DTO mapping
                .andExpect(jsonPath("$.content[0].senderId").value(user2.getId().toString()))
                .andExpect(jsonPath("$.content[0].receiverId").value(user1.getId().toString()))
                // Verify raw entities are not leaked
                .andExpect(jsonPath("$.content[0].sender").doesNotExist())
                .andExpect(jsonPath("$.content[0].receiver").doesNotExist());
    }

    @Test
    void getHistory_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/chat/history/" + user2.getId()))
                .andExpect(status().isUnauthorized()); // Or 403 based on Spring Security config defaults
    }

    @Test
    void getHistory_PaginationWorks() throws Exception {
        // Save 3 messages
        chatMessageRepository.save(ChatMessage.builder().sender(user1).receiver(user2).content("Msg 1").build());
        Thread.sleep(50);
        chatMessageRepository.save(ChatMessage.builder().sender(user2).receiver(user1).content("Msg 2").build());
        Thread.sleep(50);
        chatMessageRepository.save(ChatMessage.builder().sender(user1).receiver(user2).content("Msg 3").build());

        // Request page 0, size 2
        String jsonResponse = mockMvc.perform(get("/api/chat/history/" + user2.getId())
                        .param("page", "0")
                        .param("size", "2")
                        .header("Authorization", user1Token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        System.out.println("PAGE JSON SHAPE: " + jsonResponse);

        mockMvc.perform(get("/api/chat/history/" + user2.getId())
                        .param("page", "0")
                        .param("size", "2")
                        .header("Authorization", user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(3))
                // Verify DESC order
                .andExpect(jsonPath("$.content[0].content").value("Msg 3"))
                .andExpect(jsonPath("$.content[1].content").value("Msg 2"));
    }

    @Test
    void getHistory_IsIsolatedToAuthenticatedUser() throws Exception {
        // User1 and User2 have a conversation
        chatMessageRepository.save(ChatMessage.builder().sender(user1).receiver(user2).content("Secret").build());

        // Unrelated user tries to fetch history with User2. It should return empty, not User1's messages.
        mockMvc.perform(get("/api/chat/history/" + user2.getId())
                        .header("Authorization", unrelatedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }
    
    @Test
    void getHistory_EmptyHistory_ReturnsEmptyPage() throws Exception {
        mockMvc.perform(get("/api/chat/history/" + user2.getId())
                        .header("Authorization", user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    // --- UNREAD COUNT TESTS ---

    @Test
    void getUnreadCount_Authenticated_ReturnsCorrectCount() throws Exception {
        // 2 unread messages for user1, 1 read message
        chatMessageRepository.save(ChatMessage.builder().sender(user2).receiver(user1).content("Unread 1").isRead(false).build());
        chatMessageRepository.save(ChatMessage.builder().sender(user2).receiver(user1).content("Unread 2").isRead(false).build());
        chatMessageRepository.save(ChatMessage.builder().sender(user2).receiver(user1).content("Read 1").isRead(true).build());
        
        // 1 unread message for user2 (should not count)
        chatMessageRepository.save(ChatMessage.builder().sender(user1).receiver(user2).content("Unread User2").isRead(false).build());

        mockMvc.perform(get("/api/chat/unread-count")
                        .header("Authorization", user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(2));
    }

    @Test
    void getUnreadCount_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/chat/unread-count"))
                .andExpect(status().isUnauthorized());
    }

    // --- MARK READ TESTS ---

    @Test
    void markAsRead_UpdatesOnlyReceivedMessagesFromContact() throws Exception {
        // Unread from User2 to User1
        ChatMessage m1 = chatMessageRepository.save(ChatMessage.builder().sender(user2).receiver(user1).content("M1").isRead(false).build());
        // Unread from User3 to User1 (should not be marked read)
        ChatMessage m2 = chatMessageRepository.save(ChatMessage.builder().sender(unrelatedUser).receiver(user1).content("M2").isRead(false).build());
        // Unread from User1 to User2 (should not be marked read by user1)
        ChatMessage m3 = chatMessageRepository.save(ChatMessage.builder().sender(user1).receiver(user2).content("M3").isRead(false).build());

        mockMvc.perform(put("/api/chat/mark-read/" + user2.getId())
                        .header("Authorization", user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        // Assert DB state
        assert(chatMessageRepository.findById(m1.getId()).get().isRead());
        assert(!chatMessageRepository.findById(m2.getId()).get().isRead());
        assert(!chatMessageRepository.findById(m3.getId()).get().isRead());
    }

    // --- RECENT CHATS TESTS ---

    @Test
    void getRecentChats_Authenticated_ReturnsRecentList() throws Exception {
        // We simulate recent chats by inserting messages. User1 talks to User2 and User3.
        chatMessageRepository.save(ChatMessage.builder().sender(user2).receiver(user1).content("Hello from U2").isRead(false).build());
        
        // Ensure some time gap
        Thread.sleep(100);
        
        chatMessageRepository.save(ChatMessage.builder().sender(unrelatedUser).receiver(user1).content("Hello from U3").isRead(true).build());

        mockMvc.perform(get("/api/chat/recent")
                        .header("Authorization", user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                // Due to sorting by newest message, U3 should be first, then U2.
                .andExpect(jsonPath("$[0].contactId").value(unrelatedUser.getId().toString()))
                .andExpect(jsonPath("$[0].lastMessage").value("Hello from U3"))
                .andExpect(jsonPath("$[0].unreadCount").value(0))
                .andExpect(jsonPath("$[1].contactId").value(user2.getId().toString()))
                .andExpect(jsonPath("$[1].lastMessage").value("Hello from U2"))
                .andExpect(jsonPath("$[1].unreadCount").value(1));
    }
    
    @Test
    void getRecentChats_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/chat/recent"))
                .andExpect(status().isUnauthorized());
    }
}
