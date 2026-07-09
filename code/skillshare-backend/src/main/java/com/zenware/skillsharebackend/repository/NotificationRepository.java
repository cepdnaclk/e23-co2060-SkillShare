package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // LOGIC: Fetch all notifications for a specific user, sorted newest first!
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    // LOGIC: Count how many unread messages a user has (perfect for the UI badge!)
    long countByRecipientIdAndIsReadFalse(UUID recipientId);
}