package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.ChatMessageDto;
import com.zenware.skillsharebackend.entity.ChatMessage;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.ChatMessageRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller // Notice this is @Controller, not @RestController!
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDto chatMessageDto) {
        // 1. Find the sender and receiver in the database
        User sender = userRepository.findById(chatMessageDto.getSenderId())
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        User receiver = userRepository.findById(chatMessageDto.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        // 2. Build and save the message to PostgreSQL for history
        ChatMessage savedMsg = chatMessageRepository.save(ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(chatMessageDto.getContent())
                .isRead(false)
                .build());

        // 3. Update the DTO with the exact server timestamp before sending it to the receiver
        chatMessageDto.setTimestamp(savedMsg.getTimestamp());

        // 4. Instantly push the message to the receiver's active WebSocket connection
        // The URL pattern becomes: /user/{receiverId}/queue/messages
        messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessageDto.getReceiverId()),
                "/queue/messages",
                chatMessageDto
        );
    }
}