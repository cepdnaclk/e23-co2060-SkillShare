package com.zenware.skillsharebackend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * LOGIC: A safe DTO to return after submitting feedback.
 * We NEVER return raw Feedback entities because they contain lazy-loaded
 * proxies (Session -> Skill) that cannot be serialized after the
 * @Transactional method closes the Hibernate session.
 */
@Data
@Builder
public class FeedbackResponse {

    private UUID id;
    private UUID sessionId;
    private UUID giverId;
    private String giverName;
    private UUID receiverId;
    private String receiverName;
    private String feedbackTag;
    private Integer weight;
    private LocalDateTime createdAt;
}
