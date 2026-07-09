package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.ConnectionDto;
import com.zenware.skillsharebackend.dto.UserPublicDto;
import com.zenware.skillsharebackend.entity.Connection;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.service.ConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    // 1. Send Request (Triggered when someone clicks "Connect" on a profile)
    @PostMapping("/request/{receiverId}")
    public ResponseEntity<?> sendRequest(@PathVariable UUID receiverId) {
        connectionService.sendConnectionRequest(receiverId);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Connection request sent successfully!"
        ));
    }

    // 2. Accept Request (Triggered from the notification dropdown)
    @PutMapping("/accept/{connectionId}")
    public ResponseEntity<?> acceptRequest(@PathVariable UUID connectionId) {
        connectionService.acceptConnectionRequest(connectionId);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Connection request accepted! You are now connected."
        ));
    }

    // 3. Reject Request
    @DeleteMapping("/reject/{connectionId}")
    public ResponseEntity<?> rejectRequest(@PathVariable UUID connectionId) {
        connectionService.rejectConnectionRequest(connectionId);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Connection request rejected."
        ));
    }

    // 4. Get Pending Requests (To populate the notification bell / pending tab)
    @GetMapping("/pending")
    public ResponseEntity<List<ConnectionDto>> getPendingRequests() {
        List<ConnectionDto> dtos = connectionService.getMyPendingRequests().stream()
                .map(this::mapToConnectionDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // 4.5. Get Connection Status (For the ViewProfile page)
    @GetMapping("/status/{userId}")
    public ResponseEntity<com.zenware.skillsharebackend.dto.ConnectionStatusDto> getConnectionStatus(@PathVariable UUID userId) {
        return ResponseEntity.ok(connectionService.getConnectionStatus(userId));
    }

    // 5. Get All Friends (To populate the chat sidebar or network page)
    @GetMapping("/friends")
    public ResponseEntity<List<ConnectionDto>> getMyFriends() {
        List<ConnectionDto> dtos = connectionService.getMyFriends().stream()
                .map(this::mapToConnectionDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    private ConnectionDto mapToConnectionDto(Connection connection) {
        return ConnectionDto.builder()
                .id(connection.getId())
                .status(connection.getStatus().name())
                .sender(mapToPublicDto(connection.getSender()))
                .receiver(mapToPublicDto(connection.getReceiver()))
                .build();
    }

    private UserPublicDto mapToPublicDto(User user) {
        return UserPublicDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .profilePictureUrl(user.getProfilePictureUrl())
                .xp(user.getXp() != null ? user.getXp() : 0)
                .level(user.getLevel() != null ? user.getLevel() : 1)
                .reputationScore(user.getReputationScore() != null ? user.getReputationScore() : 0)
                .build();
    }
}