package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.ChatMessage;
import com.zenware.skillsharebackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    /**
     * Fetches the entire conversation history between two users.
     * It checks both directions (User1 -> User2 OR User2 -> User1)
     * and orders them from oldest to newest so the UI flows correctly.
     */
    @Query("SELECT m FROM ChatMessage m WHERE " +
            "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
            "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
            "ORDER BY m.timestamp DESC")
    Page<ChatMessage> findConversationHistory(
            @Param("userId1") UUID userId1,
            @Param("userId2") UUID userId2,
            Pageable pageable);

    /**
     * Counts how many unread messages a user currently has.
     * Great for a global notification badge on the UI!
     */
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.receiver.id = :receiverId AND m.isRead = false")
    long countUnreadMessages(@Param("receiverId") UUID receiverId);

    /**
     * Fetches only the single most recent message between two users.
     */
    @Query("SELECT m FROM ChatMessage m WHERE " +
            "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
            "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
            "ORDER BY m.timestamp DESC LIMIT 1")
    ChatMessage findLastMessageBetweenUsers(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);

    /**
     * Counts unread messages from ONE specific sender to the current user.
     */
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.isRead = false")
    long countUnreadMessagesFromContact(@Param("senderId") UUID senderId, @Param("receiverId") UUID receiverId);

    /**
     * Fetches a distinct list of Users who have either sent a message to OR received a message from the current user.
     * This ensures non-friends still show up in the inbox if a conversation exists.
     */
    @Query("SELECT DISTINCT u FROM User u WHERE u.id IN " +
            "(SELECT m.sender.id FROM ChatMessage m WHERE m.receiver.id = :userId) " +
            "OR u.id IN " +
            "(SELECT m.receiver.id FROM ChatMessage m WHERE m.sender.id = :userId)")
    List<User> findUsersWithConversation(@Param("userId") UUID userId);

    /**
     * Fetches all unread messages sent by a specific user to the current user.
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.isRead = false")
    List<ChatMessage> findUnreadMessages(@Param("senderId") UUID senderId, @Param("receiverId") UUID receiverId);
}