package com.zenware.skillsharebackend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageDto {

    // Added: the frontend needs the server-generated id for deduplication.
    // Without this, every received message has no id and duplicates are
    // appended on every re-render.
    private UUID id;

    private UUID senderId;
    private UUID receiverId;
    private String content;

    // @JsonFormat forces ISO-8601 string output even without the global property,
    // acting as a belt-and-suspenders safety net.
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    // Added: lets the frontend show read/unread indicators.
    private boolean isRead;
}