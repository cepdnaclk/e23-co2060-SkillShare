package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.Connection;
import com.zenware.skillsharebackend.entity.ConnectionStatus;
import com.zenware.skillsharebackend.entity.NotificationType;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.ConnectionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // --- THE SECURITY ENGINE ---
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found!"));
    }

    // 1. SEND A FRIEND REQUEST
    @Transactional
    public Connection sendConnectionRequest(UUID receiverId) {
        User sender = getAuthenticatedUser();

        // Guardrail 1: Prevent sending a request to yourself
        if (sender.getId().equals(receiverId)) {
            throw new IllegalArgumentException("You cannot send a connection request to yourself.");
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found!"));

        // Guardrail 2: Check if a connection (Pending, Accepted, or Rejected) already exists
        Optional<Connection> existingConnection = connectionRepository.findExistingConnection(sender.getId(), receiver.getId());
        if (existingConnection.isPresent()) {
            throw new IllegalStateException("A connection or pending request already exists between you and this user.");
        }

        // Create and save the new pending connection
        Connection newConnection = Connection.builder()
                .sender(sender)
                .receiver(receiver)
                .status(ConnectionStatus.PENDING)
                .build();

        Connection savedConnection = connectionRepository.save(newConnection);

        // Notify the receiver!
        notificationService.sendNotification(
                receiver,
                sender.getFullName() + " sent you a connection request!",
                NotificationType.SYSTEM_ALERT
        );

        return savedConnection;
    }

    // 2. ACCEPT A FRIEND REQUEST
    @Transactional
    public Connection acceptConnectionRequest(UUID connectionId) {
        User currentUser = getAuthenticatedUser();

        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new IllegalArgumentException("Connection request not found!"));

        // Zero-Trust Guardrail: Only the intended receiver can accept the request
        if (!connection.getReceiver().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Security Violation: You do not have permission to accept this request.");
        }

        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be accepted.");
        }

        connection.setStatus(ConnectionStatus.ACCEPTED);
        Connection updatedConnection = connectionRepository.save(connection);

        // Notify the sender that their request was accepted
        notificationService.sendNotification(
                connection.getSender(),
                currentUser.getFullName() + " accepted your connection request!",
                NotificationType.SYSTEM_ALERT
        );

        return updatedConnection;
    }

    // 3. REJECT A FRIEND REQUEST
    @Transactional
    public void rejectConnectionRequest(UUID connectionId) {
        User currentUser = getAuthenticatedUser();

        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new IllegalArgumentException("Connection request not found!"));

        // Zero-Trust Guardrail: Only the intended receiver can reject the request
        if (!connection.getReceiver().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Security Violation: You do not have permission to reject this request.");
        }

        // Action: We can either set the status to REJECTED, or simply delete the row so they can try again in the future.
        // For Skill-Connect, deleting the row is usually cleaner so the database doesn't fill up with rejected requests.
        connectionRepository.delete(connection);
    }

    // 4. FETCH PENDING REQUESTS (For the Notification/Network Page)
    public List<Connection> getMyPendingRequests() {
        User currentUser = getAuthenticatedUser();
        return connectionRepository.findByReceiverIdAndStatus(currentUser.getId(), ConnectionStatus.PENDING);
    }

    // 5. FETCH ALL ACCEPTED FRIENDS (For the Chat System later)
    public List<Connection> getMyFriends() {
        User currentUser = getAuthenticatedUser();
        return connectionRepository.findAllAcceptedConnectionsForUser(currentUser.getId());
    }
}