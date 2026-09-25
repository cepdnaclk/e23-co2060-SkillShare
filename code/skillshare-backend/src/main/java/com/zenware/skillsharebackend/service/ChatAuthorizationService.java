package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatAuthorizationService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public boolean isAuthorizedToChat(UUID senderId, UUID receiverId) {
        if (senderId == null || receiverId == null || senderId.equals(receiverId)) {
            return false;
        }

        boolean isSenderActive = userRepository.findById(senderId)
                .map(User::getIsActive)
                .orElse(false);

        boolean isReceiverActive = userRepository.findById(receiverId)
                .map(User::getIsActive)
                .orElse(false);

        return isSenderActive && isReceiverActive;
    }
}
