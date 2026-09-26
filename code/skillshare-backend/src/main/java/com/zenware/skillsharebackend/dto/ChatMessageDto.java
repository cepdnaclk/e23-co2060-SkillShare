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
public class ChatMessageDto {
    private UUID id;
    private UUID clientMessageId;
    private UUID senderId;
    private UUID receiverId;
    private String content;
    private Instant timestamp;
}
