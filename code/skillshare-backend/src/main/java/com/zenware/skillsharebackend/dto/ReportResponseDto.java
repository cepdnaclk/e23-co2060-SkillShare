package com.zenware.skillsharebackend.dto;

import com.zenware.skillsharebackend.entity.ReportReason;
import com.zenware.skillsharebackend.entity.ReportStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ReportResponseDto {
    private UUID id;
    private UUID reporterId;
    private String reporterName;
    private UUID reportedUserId;
    private String reportedUserName;
    private String reportedUserEmail;
    private UUID sessionId;
    private ReportReason reason;
    private String description;
    private ReportStatus status; // E.g., PENDING, RESOLVED, DISMISSED
    private LocalDateTime createdAt;
}