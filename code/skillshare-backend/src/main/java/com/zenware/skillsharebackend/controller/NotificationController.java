package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.entity.Notification;
import com.zenware.skillsharebackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 🛡️ SECURITY UPGRADE: URL changed from /{userId} to /my-inbox
    @GetMapping("/my-inbox")
    public ResponseEntity<List<Notification>> getUserInbox() {
        // The token automatically tells the service whose inbox to fetch!
        return ResponseEntity.ok(notificationService.getMyNotifications());
    }

    // 🛡️ SECURITY UPGRADE: URL changed from /{userId}/unread-count to /unread-count
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getMyUnreadCount());
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<String> markNotificationAsRead(@PathVariable UUID notificationId) {
        // The service will safely check if the logged-in user actually owns this notification
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok("Notification marked as read successfully.");
    }
}