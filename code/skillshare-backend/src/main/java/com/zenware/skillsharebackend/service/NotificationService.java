package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.Notification;
import com.zenware.skillsharebackend.entity.NotificationType;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.NotificationRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor // LOGIC: Modern constructor injection
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // --- THE SECURITY ENGINE ---
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }

    // LOGIC: The internal engine to create a notification. Used securely by the backend!
    @Transactional
    public void sendNotification(User recipient, String message, NotificationType type) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .type(type)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    // SECURITY UPGRADE: We no longer trust the frontend to provide the userId
    public List<Notification> getMyNotifications() {
        User me = getAuthenticatedUser();
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(me.getId());
    }

    // SECURITY UPGRADE: We no longer trust the frontend to provide the userId
    public long getMyUnreadCount() {
        User me = getAuthenticatedUser();
        return notificationRepository.countByRecipientIdAndIsReadFalse(me.getId());
    }

    // SECURITY UPGRADE: We must verify the person clicking "read" actually owns it
    @Transactional
    public void markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getRecipient().getId().equals(getAuthenticatedUser().getId())) {
            throw new IllegalStateException("Security Violation: You cannot read someone else's notifications!");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
}