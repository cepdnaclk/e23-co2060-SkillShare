package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.RecentChatDto;
import com.zenware.skillsharebackend.entity.ChatMessage;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.ChatMessageRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ConnectionService connectionService;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));
    }

    // Fetch the chat history between the logged-in user and a target user
    public Page<ChatMessage> getConversationHistory(UUID contactId, int page, int size) {
        User currentUser = getAuthenticatedUser();
        // Create a page request (e.g., page 0, size 50)
        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.findConversationHistory(currentUser.getId(), contactId, pageable);
    }

    // Fetch the total unread message count for the notification bell
    public long getUnreadMessageCount() {
        User currentUser = getAuthenticatedUser();
        return chatMessageRepository.countUnreadMessages(currentUser.getId());
    }

    // Mark all messages from a specific user as "Read" when opening the chat
    @Transactional
    public void markMessagesAsRead(UUID senderId) {
        User currentUser = getAuthenticatedUser();

        // Find all messages sent BY the contact, TO the current user, where isRead is false
        // (For a production app, you might want a custom query for this to be faster,
        // but fetching the history and updating the flags works perfectly for the MVP)
        List<ChatMessage> unreadMessages = chatMessageRepository.findConversationHistory(currentUser.getId(), senderId)
                .stream()
                .filter(msg -> msg.getReceiver().getId().equals(currentUser.getId()) && !msg.isRead())
                .toList();

        for (ChatMessage msg : unreadMessages) {
            msg.setRead(true);
        }

        chatMessageRepository.saveAll(unreadMessages);
    }

    public List<RecentChatDto> getRecentConversations() {
        User currentUser = getAuthenticatedUser();

        // 1. Get all accepted friends and map them directly to 'User' objects
        java.util.Set<User> contactList = connectionService.getMyFriends().stream()
                .map(connection -> connection.getSender().getId().equals(currentUser.getId())
                        ? connection.getReceiver()
                        : connection.getSender())
                .collect(java.util.stream.Collectors.toSet());

        // 2. Fetch anyone we have chatted with, regardless of friend status, and add them to the Set
        List<User> chatPartners = chatMessageRepository.findUsersWithConversation(currentUser.getId());
        contactList.addAll(chatPartners); // A Set automatically ignores duplicates!

        // 3. Build the UI row for every unique contact
        return contactList.stream().map(contact -> {

                    ChatMessage lastMsg = chatMessageRepository.findLastMessageBetweenUsers(currentUser.getId(), contact.getId());
                    long unreadCount = chatMessageRepository.countUnreadMessagesFromContact(contact.getId(), currentUser.getId());

                    return RecentChatDto.builder()
                            .contactId(contact.getId())
                            .contactName(contact.getFullName())
                            .contactProfilePicture(contact.getProfilePictureUrl())
                            .lastMessage(lastMsg != null ? lastMsg.getContent() : "Start a conversation!")
                            .lastMessageTime(lastMsg != null ? lastMsg.getTimestamp() : null)
                            .unreadCount(unreadCount)
                            .build();

                })
                // 4. Sort the whole list so the most recent conversations jump to the top
                .sorted((c1, c2) -> {
                    if (c1.getLastMessageTime() == null && c2.getLastMessageTime() == null) return 0;
                    if (c1.getLastMessageTime() == null) return 1;
                    if (c2.getLastMessageTime() == null) return -1;
                    return c2.getLastMessageTime().compareTo(c1.getLastMessageTime());
                })
                .toList();
    }
}