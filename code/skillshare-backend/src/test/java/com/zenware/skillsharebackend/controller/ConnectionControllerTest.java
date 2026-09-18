package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.entity.Connection;
import com.zenware.skillsharebackend.entity.ConnectionStatus;
import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.ConnectionRepository;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class ConnectionControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private com.zenware.skillsharebackend.repository.NotificationRepository notificationRepository;

    private MockMvc mockMvc;

    private User sender;
    private User receiver;
    private User unrelatedUser;
    private String senderToken;
    private String receiverToken;
    private String unrelatedToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .addFilters(springSecurityFilterChain)
                .build();

        notificationRepository.deleteAll();
        connectionRepository.deleteAll();
        userRepository.deleteAll();

        sender = User.builder()
                .email("sender_conn@example.com")
                .fullName("Sender Conn")
                .password("password")
                .role(Role.USER)
                .build();
        sender = userRepository.save(sender);
        senderToken = "Bearer " + jwtService.generateToken(sender);

        receiver = User.builder()
                .email("receiver_conn@example.com")
                .fullName("Receiver Conn")
                .password("password")
                .role(Role.USER)
                .build();
        receiver = userRepository.save(receiver);
        receiverToken = "Bearer " + jwtService.generateToken(receiver);

        unrelatedUser = User.builder()
                .email("unrelated_conn@example.com")
                .fullName("Unrelated Conn")
                .password("password")
                .role(Role.USER)
                .build();
        unrelatedUser = userRepository.save(unrelatedUser);
        unrelatedToken = "Bearer " + jwtService.generateToken(unrelatedUser);
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        connectionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void sendRequest_Authenticated_Returns200() throws Exception {
        mockMvc.perform(post("/api/connections/request/" + receiver.getId())
                        .header("Authorization", senderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        assertFalse(connectionRepository.findAll().isEmpty());
    }

    @Test
    void sendRequest_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(post("/api/connections/request/" + receiver.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void sendRequest_DuplicateRequest_Returns409() throws Exception {
        Connection connection = Connection.builder()
                .sender(sender)
                .receiver(receiver)
                .status(ConnectionStatus.PENDING)
                .build();
        connectionRepository.save(connection);

        long initialCount = connectionRepository.count();

        mockMvc.perform(post("/api/connections/request/" + receiver.getId())
                        .header("Authorization", senderToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("You have already sent a connection request to this user.")));

        org.junit.jupiter.api.Assertions.assertEquals(initialCount, connectionRepository.count());
    }

    @Test
    void sendRequest_InverseRequest_AutoAcceptsAndReturns200() throws Exception {
        Connection connection = Connection.builder()
                .sender(receiver) // The 'receiver' originally sent the request to 'sender'
                .receiver(sender)
                .status(ConnectionStatus.PENDING)
                .build();
        connectionRepository.save(connection);

        // Sender now sends a request back to Receiver
        mockMvc.perform(post("/api/connections/request/" + receiver.getId())
                        .header("Authorization", senderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        // Verify it was auto-accepted
        Connection updatedConnection = connectionRepository.findAll().get(0);
        org.junit.jupiter.api.Assertions.assertEquals(ConnectionStatus.ACCEPTED, updatedConnection.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(1, connectionRepository.count());
    }

    @Test
    void sendRequest_ToSelf_Returns400() throws Exception {
        mockMvc.perform(post("/api/connections/request/" + sender.getId())
                        .header("Authorization", senderToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You cannot send a connection request to yourself."));
    }

    @Test
    void sendRequest_InvalidReceiverId_Returns400() throws Exception {
        mockMvc.perform(post("/api/connections/request/" + UUID.randomUUID())
                        .header("Authorization", senderToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Target user not found!"));
    }

    @Test
    void acceptRequest_ReceiverAccepts_Returns200() throws Exception {
        Connection connection = Connection.builder()
                .sender(sender)
                .receiver(receiver)
                .status(ConnectionStatus.PENDING)
                .build();
        connection = connectionRepository.save(connection);

        mockMvc.perform(put("/api/connections/accept/" + connection.getId())
                        .header("Authorization", receiverToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));
    }

    @Test
    void acceptRequest_UnrelatedUser_Returns403() throws Exception {
        Connection connection = Connection.builder()
                .sender(sender)
                .receiver(receiver)
                .status(ConnectionStatus.PENDING)
                .build();
        connection = connectionRepository.save(connection);

        mockMvc.perform(put("/api/connections/accept/" + connection.getId())
                        .header("Authorization", unrelatedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Security Violation: You do not have permission to accept this request.")));
    }

    @Test
    void rejectRequest_ReceiverRejects_Returns200() throws Exception {
        Connection connection = Connection.builder()
                .sender(sender)
                .receiver(receiver)
                .status(ConnectionStatus.PENDING)
                .build();
        connection = connectionRepository.save(connection);

        mockMvc.perform(delete("/api/connections/reject/" + connection.getId())
                        .header("Authorization", receiverToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));
    }

    @Test
    void rejectRequest_UnrelatedUser_Returns403() throws Exception {
        Connection connection = Connection.builder()
                .sender(sender)
                .receiver(receiver)
                .status(ConnectionStatus.PENDING)
                .build();
        connection = connectionRepository.save(connection);

        mockMvc.perform(delete("/api/connections/reject/" + connection.getId())
                        .header("Authorization", unrelatedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Security Violation: You do not have permission to reject this request.")));
    }

    @Test
    void getPendingRequests_ReturnsList() throws Exception {
        Connection connection = Connection.builder()
                .sender(sender)
                .receiver(receiver)
                .status(ConnectionStatus.PENDING)
                .build();
        connectionRepository.save(connection);

        mockMvc.perform(get("/api/connections/pending")
                        .header("Authorization", receiverToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].sender.id").value(sender.getId().toString()));
    }

    @Test
    void getMyFriends_ReturnsList() throws Exception {
        Connection connection = Connection.builder()
                .sender(sender)
                .receiver(receiver)
                .status(ConnectionStatus.ACCEPTED) // ACCEPTED makes them friends
                .build();
        connectionRepository.save(connection);

        mockMvc.perform(get("/api/connections/friends")
                        .header("Authorization", receiverToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }
}
