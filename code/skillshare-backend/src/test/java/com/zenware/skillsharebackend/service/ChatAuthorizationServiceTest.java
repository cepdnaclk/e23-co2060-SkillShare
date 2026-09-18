package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.Connection;
import com.zenware.skillsharebackend.entity.ConnectionStatus;
import com.zenware.skillsharebackend.repository.ConnectionRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
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
    private ConnectionRepository connectionRepository;

    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private ChatAuthorizationService chatAuthorizationService;

    @Test
    void isAuthorizedToChat_AcceptedFriend_ReturnsTrue() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();
        Connection connection = Connection.builder().status(ConnectionStatus.ACCEPTED).build();

        when(connectionRepository.findExistingConnection(senderId, receiverId)).thenReturn(Optional.of(connection));

        assertTrue(chatAuthorizationService.isAuthorizedToChat(senderId, receiverId));
        verify(connectionRepository).findExistingConnection(senderId, receiverId);
        verifyNoInteractions(sessionRepository);
    }

    @Test
    void isAuthorizedToChat_PendingFriend_ChecksSharedSession() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();
        Connection connection = Connection.builder().status(ConnectionStatus.PENDING).build();

        when(connectionRepository.findExistingConnection(senderId, receiverId)).thenReturn(Optional.of(connection));
        when(sessionRepository.countSharedSessions(senderId, receiverId)).thenReturn(1L);

        assertTrue(chatAuthorizationService.isAuthorizedToChat(senderId, receiverId));
    }

    @Test
    void isAuthorizedToChat_SharedSession_ReturnsTrue() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();

        when(connectionRepository.findExistingConnection(senderId, receiverId)).thenReturn(Optional.empty());
        when(sessionRepository.countSharedSessions(senderId, receiverId)).thenReturn(1L);

        assertTrue(chatAuthorizationService.isAuthorizedToChat(senderId, receiverId));
    }

    @Test
    void isAuthorizedToChat_UnrelatedUsers_ReturnsFalse() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();

        when(connectionRepository.findExistingConnection(senderId, receiverId)).thenReturn(Optional.empty());
        when(sessionRepository.countSharedSessions(senderId, receiverId)).thenReturn(0L);

        assertFalse(chatAuthorizationService.isAuthorizedToChat(senderId, receiverId));
    }

    @Test
    void isAuthorizedToChat_SelfChat_ReturnsFalse() {
        UUID senderId = UUID.randomUUID();

        assertFalse(chatAuthorizationService.isAuthorizedToChat(senderId, senderId));
        verifyNoInteractions(connectionRepository);
        verifyNoInteractions(sessionRepository);
    }

    @Test
    void isAuthorizedToChat_NullIds_ReturnsFalse() {
        assertFalse(chatAuthorizationService.isAuthorizedToChat(null, UUID.randomUUID()));
        assertFalse(chatAuthorizationService.isAuthorizedToChat(UUID.randomUUID(), null));
        assertFalse(chatAuthorizationService.isAuthorizedToChat(null, null));
    }
}
