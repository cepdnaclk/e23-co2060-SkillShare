package com.zenware.skillsharebackend.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zenware.skillsharebackend.repository.ConnectionRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatAuthorizationService {

    // No longer used to gate chat access (any authenticated user may message
    // any other user, friends/connections or not) — kept as a dependency in
    // case other authorization rules (e.g. blocked users) are added later.
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

        // Previously required an accepted connection or a shared session,
        // which silently dropped messages (no DB row, no delivery, no error
        // back to the sender) between users who weren't friends yet — that
        // was the cause of conversations "disappearing" after being closed.
        // Any two distinct authenticated users may now chat freely.
        return true;
    }
}
