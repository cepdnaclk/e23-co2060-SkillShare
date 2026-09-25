package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatAuthorizationServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ChatAuthorizationService chatAuthorizationService;

    @Test
    void isAuthorizedToChat_ActiveSenderAndReceiver_ReturnsTrue() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();

        User sender = User.builder().isActive(true).build();
        User receiver = User.builder().isActive(true).build();

        when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));

        assertTrue(chatAuthorizationService.isAuthorizedToChat(senderId, receiverId));
        verify(userRepository).findById(senderId);
        verify(userRepository).findById(receiverId);
    }

    @Test
    void isAuthorizedToChat_InactiveSender_ReturnsFalse() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();

        User sender = User.builder().isActive(false).build();
        User receiver = User.builder().isActive(true).build();

        when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
        // Strict stubbing might fail if it short circuits, but since it checks sender then receiver, it will evaluate receiver.
        when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));

        assertFalse(chatAuthorizationService.isAuthorizedToChat(senderId, receiverId));
    }

    @Test
    void isAuthorizedToChat_InactiveReceiver_ReturnsFalse() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();

        User sender = User.builder().isActive(true).build();
        User receiver = User.builder().isActive(false).build();

        when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));

        assertFalse(chatAuthorizationService.isAuthorizedToChat(senderId, receiverId));
    }

    @Test
    void isAuthorizedToChat_NonexistentSender_ReturnsFalse() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();

        User receiver = User.builder().isActive(true).build();

        when(userRepository.findById(senderId)).thenReturn(Optional.empty());
        when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));

        assertFalse(chatAuthorizationService.isAuthorizedToChat(senderId, receiverId));
    }

    @Test
    void isAuthorizedToChat_NonexistentReceiver_ReturnsFalse() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();

        User sender = User.builder().isActive(true).build();

        when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiverId)).thenReturn(Optional.empty());

        assertFalse(chatAuthorizationService.isAuthorizedToChat(senderId, receiverId));
    }

    @Test
    void isAuthorizedToChat_SelfChat_ReturnsFalse() {
        UUID senderId = UUID.randomUUID();

        assertFalse(chatAuthorizationService.isAuthorizedToChat(senderId, senderId));
        verifyNoInteractions(userRepository);
    }

    @Test
    void isAuthorizedToChat_NullIds_ReturnsFalse() {
        assertFalse(chatAuthorizationService.isAuthorizedToChat(null, UUID.randomUUID()));
        assertFalse(chatAuthorizationService.isAuthorizedToChat(UUID.randomUUID(), null));
        assertFalse(chatAuthorizationService.isAuthorizedToChat(null, null));
        verifyNoInteractions(userRepository);
    }
}
