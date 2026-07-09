package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.RecentChatDto;
import com.zenware.skillsharebackend.entity.ChatMessage;
import com.zenware.skillsharebackend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;

    // 1. Fetch History (Called when the frontend opens a specific chat window)
    @GetMapping("/history/{contactId}")
    public ResponseEntity<Page<ChatMessage>> getHistory(
            @PathVariable UUID contactId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(chatService.getConversationHistory(contactId, page, size));
    }

    // 2. Get Global Unread Count (Called when the app first loads to show the red badge)
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        long count = chatService.getUnreadMessageCount();
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    // 3. Mark as Read (Called when the user clicks into a chat window)
    @PutMapping("/mark-read/{contactId}")
    public ResponseEntity<?> markAsRead(@PathVariable UUID contactId) {
        chatService.markMessagesAsRead(contactId);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Messages marked as read"));
    }
    // 4. Get Recent Chats (To populate the main WhatsApp-style chat list)
    @GetMapping("/recent")
    public ResponseEntity<List<RecentChatDto>> getRecentChats() {
        return ResponseEntity.ok(chatService.getRecentConversations());
    }
}