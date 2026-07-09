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
import com.zenware.skillsharebackend.dto.TypingStatusDto;

import java.time.LocalDateTime;

@Controller // Notice this is @Controller, not @RestController!
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDto chatMessageDto) {
        System.out.println("\n🚀 --- NEW WEBSOCKET MESSAGE RECEIVED ---");
        System.out.println("Sender ID: " + chatMessageDto.getSenderId());
        System.out.println("Receiver ID: " + chatMessageDto.getReceiverId());
        System.out.println("Content: " + chatMessageDto.getContent());

        try {
            // 1. Find the sender and receiver in the database
            User sender = userRepository.findById(chatMessageDto.getSenderId())
                    .orElseThrow(() -> new IllegalArgumentException("Sender not found in DB! UUID: " + chatMessageDto.getSenderId()));

            User receiver = userRepository.findById(chatMessageDto.getReceiverId())
                    .orElseThrow(() -> new IllegalArgumentException("Receiver not found in DB! UUID: " + chatMessageDto.getReceiverId()));

            // 2. Build and save the message to PostgreSQL for history
            ChatMessage savedMsg = chatMessageRepository.save(ChatMessage.builder()
                    .sender(sender)
                    .receiver(receiver)
                    .content(chatMessageDto.getContent())
                    .isRead(false)
                    .build());

            System.out.println("✅ Message successfully saved to PostgreSQL!");

            // 3. Update the DTO with the exact server timestamp
            chatMessageDto.setTimestamp(savedMsg.getTimestamp());

            // 4. Instantly push the message to the receiver's active WebSocket connection
            messagingTemplate.convertAndSendToUser(receiver.getEmail(), "/queue/messages", chatMessageDto);

            System.out.println("✅ Message routed to user email: " + receiver.getEmail() + " at /queue/messages\n");

        } catch (Exception e) {
            // IF ANYTHING FAILS, WE CATCH IT AND PRINT IT HERE INSTEAD OF FAILING SILENTLY
            System.err.println("❌ ERROR PROCESSING WEBSOCKET MESSAGE:");
            e.printStackTrace();
        }
    }

    @MessageMapping("/chat/typing")
    public void processTyping(@Payload TypingStatusDto typingStatus) {
        // We do not save this to the database!
        try {
            User receiver = userRepository.findById(typingStatus.getReceiverId())
                    .orElseThrow(() -> new IllegalArgumentException("Receiver not found for typing status! UUID: " + typingStatus.getReceiverId()));
            
            // We instantly route it to the receiver's dedicated typing queue using their email
            messagingTemplate.convertAndSendToUser(receiver.getEmail(), "/queue/typing", typingStatus);
        } catch (Exception e) {
            System.err.println("❌ ERROR PROCESSING TYPING STATUS:");
            e.printStackTrace();
        }
    }
}