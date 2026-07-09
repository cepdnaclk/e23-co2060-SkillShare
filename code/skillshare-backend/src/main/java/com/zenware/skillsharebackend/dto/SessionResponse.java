package com.zenware.skillsharebackend.dto;

import com.zenware.skillsharebackend.entity.SessionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * LOGIC: A safe DTO to return Session data from the REST API.
 *
 * We NEVER return raw Session entities because they contain lazy-loaded
 * proxies (Session -> Skill, Session -> learner User, Session -> mentor User,
 * and User -> skills collections) that cannot be serialized after the
 * @Transactional method closes the Hibernate session.
 *
 * All fields here are plain values with NO JPA relationships,
 * so Jackson can serialize them without any "no session" crashes.
 */
@Data
@Builder
public class SessionResponse {

    private UUID id;

    // Learner details (flat — no nested User object with lazy collections)
    private UUID learnerId;
    private String learnerName;
    private String learnerProfilePictureUrl;

    // Mentor details (flat)
    private UUID mentorId;
    private String mentorName;
    private String mentorProfilePictureUrl;

    // Skill details (flat — avoids Session -> Skill lazy proxy)
    private UUID skillId;
    private String skillName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private SessionStatus status;
    private String meetingLink;
    private Integer creditValue;
    private LocalDateTime createdAt;
}
