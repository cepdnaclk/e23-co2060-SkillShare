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

import org.springframework.messaging.simp.user.SimpUserRegistry;

@Controller // Notice this is @Controller, not @RestController!
@RequiredArgsConstructor
public class ChatController {

    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpUserRegistry simpUserRegistry;
    private final com.zenware.skillsharebackend.service.ChatAuthorizationService chatAuthorizationService;

    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDto chatMessageDto, java.security.Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Unauthenticated WebSocket connection!");
        }

        try {
            // 1. Find the true sender by authenticated email
            User sender = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Sender not found in DB! Email: " + principal.getName()));
            
            // Secure the DTO by forcing the senderId to the authenticated user's ID
            chatMessageDto.setSenderId(sender.getId());

            User receiver = userRepository.findById(chatMessageDto.getReceiverId())
                    .orElseThrow(() -> new IllegalArgumentException("Receiver not found in DB! UUID: " + chatMessageDto.getReceiverId()));

            // Authorization check
            if (!chatAuthorizationService.isAuthorizedToChat(sender.getId(), receiver.getId())) {
                throw new com.zenware.skillsharebackend.exception.UnauthorizedAccessException("Not authorized to chat with this user.");
            }

            // 2. Build and save the message to PostgreSQL for history
            ChatMessage savedMsg = chatMessageRepository.save(ChatMessage.builder()
                    .sender(sender)
                    .receiver(receiver)
                    .content(chatMessageDto.getContent())
                    .isRead(false)
                    .build());

            // 3. Update the DTO with the exact server timestamp
            chatMessageDto.setTimestamp(savedMsg.getTimestamp());
            chatMessageDto.setId(savedMsg.getId());

            // 4. Instantly push the message to the receiver's active WebSocket connection
            messagingTemplate.convertAndSendToUser(receiver.getEmail(), "/queue/messages", chatMessageDto);
            // New clients reconcile their optimistic message with the persisted instant.
            // Older clients do not request acknowledgements and keep the original protocol.
            if (chatMessageDto.getClientMessageId() != null) {
                messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/messages", chatMessageDto);
            }

        } catch (com.zenware.skillsharebackend.exception.UnauthorizedAccessException e) {
            System.err.println("❌ UNAUTHORIZED CHAT MESSAGE: " + e.getMessage());
        } catch (Exception e) {
            // IF ANYTHING FAILS, WE CATCH IT AND PRINT IT HERE INSTEAD OF FAILING SILENTLY
            System.err.println("❌ ERROR PROCESSING WEBSOCKET MESSAGE:");
            e.printStackTrace();
        }
    }

    @MessageMapping("/chat/typing")
    public void processTyping(@Payload TypingStatusDto typingStatus, java.security.Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Unauthenticated WebSocket connection!");
        }

        try {
            // Find the true sender by authenticated email
            User sender = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Sender not found in DB! Email: " + principal.getName()));

            // Secure the DTO by forcing the senderId to the authenticated user's ID
            typingStatus.setSenderId(sender.getId());

            User receiver = userRepository.findById(typingStatus.getReceiverId())
                    .orElseThrow(() -> new IllegalArgumentException("Receiver not found for typing status! UUID: " + typingStatus.getReceiverId()));
            
            // Authorization check
            if (!chatAuthorizationService.isAuthorizedToChat(sender.getId(), receiver.getId())) {
                throw new com.zenware.skillsharebackend.exception.UnauthorizedAccessException("Not authorized to chat with this user.");
            }

            // We instantly route it to the receiver's dedicated typing queue using their email
            messagingTemplate.convertAndSendToUser(receiver.getEmail(), "/queue/typing", typingStatus);
        } catch (com.zenware.skillsharebackend.exception.UnauthorizedAccessException e) {
            System.err.println("❌ UNAUTHORIZED TYPING STATUS: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ ERROR PROCESSING TYPING STATUS:");
            e.printStackTrace();
        }
    }
}
