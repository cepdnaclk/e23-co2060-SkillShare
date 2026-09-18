package com.zenware.skillsharebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private UUID id;
    private UUID senderId;
    private UUID receiverId;
    private String content;
    
    @JsonProperty("isRead")
    private Boolean isRead;
    
    private LocalDateTime timestamp;
}
