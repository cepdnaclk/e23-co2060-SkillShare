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
public class ConnectionDto {
    private UUID id;
    private UserPublicDto sender;
    private UserPublicDto receiver;
    private String status;
}
