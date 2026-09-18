package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.ChatMessageDto;
import com.zenware.skillsharebackend.dto.TypingStatusDto;
import com.zenware.skillsharebackend.entity.ChatMessage;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.ChatMessageRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.service.ChatAuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ChatAuthorizationService chatAuthorizationService;

    @Mock
    private Principal principal;

    @InjectMocks
    private ChatController chatController;

    private User sender;
    private User receiver;
    private ChatMessageDto messageDto;
    private TypingStatusDto typingDto;

    @BeforeEach
    void setUp() {
        sender = User.builder().id(UUID.randomUUID()).email("sender@test.com").build();
        receiver = User.builder().id(UUID.randomUUID()).email("receiver@test.com").build();

        messageDto = ChatMessageDto.builder()
                .receiverId(receiver.getId())
                .content("Hello")
                .build();

        typingDto = new TypingStatusDto();
        typingDto.setReceiverId(receiver.getId());
        typingDto.setTyping(true);
    }

    @Test
    void processMessage_Authorized_Success() {
        when(principal.getName()).thenReturn(sender.getEmail());
        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(chatAuthorizationService.isAuthorizedToChat(sender.getId(), receiver.getId())).thenReturn(true);
        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(new ChatMessage());

        chatController.processMessage(messageDto, principal);

        verify(chatMessageRepository).save(any(ChatMessage.class));
        verify(messagingTemplate).convertAndSendToUser(eq(receiver.getEmail()), eq("/queue/messages"), eq(messageDto));
    }

    @Test
    void processMessage_Unauthorized_NotPersisted() {
        when(principal.getName()).thenReturn(sender.getEmail());
        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(chatAuthorizationService.isAuthorizedToChat(sender.getId(), receiver.getId())).thenReturn(false);

        chatController.processMessage(messageDto, principal);

        verify(chatMessageRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), any());
    }

    @Test
    void processTyping_Authorized_Success() {
        when(principal.getName()).thenReturn(sender.getEmail());
        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(chatAuthorizationService.isAuthorizedToChat(sender.getId(), receiver.getId())).thenReturn(true);

        chatController.processTyping(typingDto, principal);

        verify(messagingTemplate).convertAndSendToUser(eq(receiver.getEmail()), eq("/queue/typing"), eq(typingDto));
    }

    @Test
    void processTyping_Unauthorized_Rejected() {
        when(principal.getName()).thenReturn(sender.getEmail());
        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(chatAuthorizationService.isAuthorizedToChat(sender.getId(), receiver.getId())).thenReturn(false);

        chatController.processTyping(typingDto, principal);

        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), any());
    }
}
