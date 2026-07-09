package com.zenware.skillsharebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TypingStatusDto {
    private UUID senderId;
    private UUID receiverId;
    
    @com.fasterxml.jackson.annotation.JsonProperty("isTyping")
    private Boolean typing;
}