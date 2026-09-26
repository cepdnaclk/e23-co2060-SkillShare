package com.zenware.skillsharebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecentChatDto {
    private UUID contactId;
    private String contactName;
    private String contactProfilePicture;
    private String lastMessage;
    private Instant lastMessageTime;
    private long unreadCount;
}
