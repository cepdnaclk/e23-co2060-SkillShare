package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.ChatMessageDto;
import com.zenware.skillsharebackend.dto.RecentChatDto;
import com.zenware.skillsharebackend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;

    // 1. Fetch History — returns a flat DTO, NOT the raw JPA entity.
    //    Returning the raw ChatMessage entity causes two problems:
    //    (a) The nested sender/receiver User objects are serialized in full,
    //        exposing the password hash and all user data to the client.
    //    (b) The frontend expects flat senderId/receiverId fields, not nested objects.
    @GetMapping("/history/{contactId}")
    public ResponseEntity<List<ChatMessageDto>> getHistory(@PathVariable UUID contactId) {
        return ResponseEntity.ok(chatService.getConversationHistory(contactId));
    }

    // 2. Get Global Unread Count
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        long count = chatService.getUnreadMessageCount();
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    // 3. Mark as Read
    @PutMapping("/mark-read/{contactId}")
    public ResponseEntity<?> markAsRead(@PathVariable UUID contactId) {
        chatService.markMessagesAsRead(contactId);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Messages marked as read"));
    }

    // 4. Get Recent Chats
    @GetMapping("/recent")
    public ResponseEntity<List<RecentChatDto>> getRecentChats() {
        return ResponseEntity.ok(chatService.getRecentConversations());
    }
}