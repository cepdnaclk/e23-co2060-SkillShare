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

        // 3. Update the DTO with the server-generated id and timestamp before broadcasting.
        //    The frontend uses the id for deduplication — without it every real-time message
        //    appears as a duplicate alongside the optimistic one.
        chatMessageDto.setId(savedMsg.getId());
        chatMessageDto.setTimestamp(savedMsg.getTimestamp());
        chatMessageDto.setRead(false);

        // 4. Push to the RECEIVER's personal queue.
        //    We use a manual destination string because convertAndSendToUser() requires
        //    a populated Principal on the WebSocket session, which we don't have when
        //    using JWT-based authentication without a custom HandshakeInterceptor.
        String destination = "/user/" + chatMessageDto.getReceiverId() + "/queue/messages";
        messagingTemplate.convertAndSend(destination, chatMessageDto);

        // 5. Also echo back to the SENDER's queue so their own tab updates if they have
        //    the chat open in multiple tabs, and so the sender receives the server-confirmed
        //    id (replacing the optimistic "optimistic-{timestamp}" id in the frontend).
        String senderDestination = "/user/" + chatMessageDto.getSenderId() + "/queue/messages";
        messagingTemplate.convertAndSend(senderDestination, chatMessageDto);
    }
}