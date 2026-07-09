package com.zenware.skillsharebackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConnectionStatusDto {
    private String status; // NONE, PENDING_SENT, PENDING_RECEIVED, FRIENDS
    private UUID connectionId; // ID of the connection record if exists, or null
}
