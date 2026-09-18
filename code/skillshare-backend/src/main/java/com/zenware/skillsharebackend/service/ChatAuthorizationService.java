package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.Connection;
import com.zenware.skillsharebackend.entity.ConnectionStatus;
import com.zenware.skillsharebackend.repository.ConnectionRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatAuthorizationService {

    private final ConnectionRepository connectionRepository;
    private final SessionRepository sessionRepository;

    @Transactional(readOnly = true)
    public boolean isAuthorizedToChat(UUID senderId, UUID receiverId) {
        if (senderId == null || receiverId == null) {
            return false;
        }
        
        if (senderId.equals(receiverId)) {
            return false; // A user may never chat with themselves
        }
        
        // Check if they are accepted friends
        Optional<Connection> conn = connectionRepository.findExistingConnection(senderId, receiverId);
        if (conn.isPresent() && conn.get().getStatus() == ConnectionStatus.ACCEPTED) {
            return true;
        }
        
        // Check if they share a session
        return sessionRepository.countSharedSessions(senderId, receiverId) > 0;
    }
}
