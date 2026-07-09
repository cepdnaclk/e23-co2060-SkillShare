package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.entity.Connection;
import com.zenware.skillsharebackend.service.ConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    public ResponseEntity<List<Connection>> getPendingRequests() {
        // NOTE: If you get an infinite JSON recursion error here, you will need to
        // add @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
        // to your User entity, or map this to a specific ConnectionDto!
        return ResponseEntity.ok(connectionService.getMyPendingRequests());
    }

    // 5. Get All Friends (To populate the chat sidebar or network page)
    @GetMapping("/friends")
    public ResponseEntity<List<Connection>> getMyFriends() {
        return ResponseEntity.ok(connectionService.getMyFriends());
    }
}