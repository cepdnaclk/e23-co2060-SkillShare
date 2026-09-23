package com.zenware.skillsharebackend.dto;

import com.zenware.skillsharebackend.entity.ReportReason;
import lombok.Data;

import java.util.UUID;

@Data
public class ReportRequestDto {
    private UUID reportedUserId;
    private UUID sessionId; // Optional
    private ReportReason reason;
    private String description;
}