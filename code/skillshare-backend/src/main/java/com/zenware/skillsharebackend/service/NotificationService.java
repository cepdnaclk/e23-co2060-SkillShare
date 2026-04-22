package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.Notification;
import com.zenware.skillsharebackend.entity.NotificationType;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // LOGIC: The internal engine to create a notification.
    // We will call this from inside SessionService and FeedbackService!
    @Transactional
    public void sendNotification(User recipient, String message, NotificationType type) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setMessage(message);
        notification.setType(type);
        // isRead defaults to false and createdAt is set automatically by @PrePersist

        notificationRepository.save(notification);
    }

    // LOGIC: For the frontend to fetch the user's inbox
    public List<Notification> getUserNotifications(UUID userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    // LOGIC: For the frontend to show the red badge count (e.g., 🔔 3)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    // LOGIC: When the user clicks the notification in the UI, we mark it as read
    @Transactional
    public void markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        notification.setRead(true);
        notificationRepository.save(notification);
    }
}