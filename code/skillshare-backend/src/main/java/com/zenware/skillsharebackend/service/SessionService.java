package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.config.SessionProperties;
import com.zenware.skillsharebackend.dto.SessionParticipantResponse;
import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.dto.SessionResponse;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.exception.UnauthorizedAccessException;
import com.zenware.skillsharebackend.repository.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private static final int EXPIRATION_BATCH_SIZE = 100;

    private static final int GROUP_SESSION_TOTAL_COST = 10;
    private static final int INDIVIDUAL_SESSION_COST = 10;

    private static final int MIN_GROUP_CAPACITY = 2;
    private static final int MAX_GROUP_CAPACITY = 5;

    private static final int CANCELLATION_PENALTY = 5;

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final AvailabilityRepository availabilityRepository;

    private final NotificationService notificationService;
    private final GamificationService gamificationService;
    private final SessionExpirationProcessor sessionExpirationProcessor;
    private final SessionProperties sessionProperties;

    private final CreditDebtRepository creditDebtRepository;
    private final SessionParticipantRepository sessionParticipantRepository;
    private final ConnectionRepository connectionRepository;

    private final Clock clock;


    // =========================================================
    // AUTHENTICATED USER
    // =========================================================

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()
                || "anonymousUser".equals(authentication.getName())) {

            throw new UnauthorizedAccessException(
                    "You must be authenticated to perform this action."
            );
        }

        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UnauthorizedAccessException(
                                "Authenticated user not found."
                        )
                );
    }


    // =========================================================
    // CURRENT TIME
    // =========================================================

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }


    // =========================================================
    // BASIC VALIDATION
    // =========================================================

    private void validateSessionId(UUID sessionId) {

        if (sessionId == null) {
            throw new IllegalArgumentException(
                    "Session ID is required."
            );
        }
    }


    private void validateUserId(UUID userId) {

        if (userId == null) {
            throw new IllegalArgumentException(
                    "User ID is required."
            );
        }
    }


    private void validateFutureSession(Session session) {

        if (session == null) {
            throw new IllegalArgumentException(
                    "Session cannot be null."
            );
        }

        if (session.getStartTime() == null
                || session.getEndTime() == null) {

            throw new IllegalStateException(
                    "Session has invalid start or end time."
            );
        }

        if (!session.getStartTime()
                .isBefore(session.getEndTime())) {

            throw new IllegalStateException(
                    "Session has invalid time range."
            );
        }

        if (!session.getStartTime().isAfter(now())) {

            throw new IllegalStateException(
                    "This session has already started or expired."
            );
        }
    }


    // =========================================================
    // DTO MAPPING
    // =========================================================

    private SessionResponse toDto(Session session) {

        if (session == null) {
            throw new IllegalArgumentException(
                    "Session cannot be null."
            );
        }

        User learner = session.getLearner();
        User mentor = session.getMentor();
        Skill skill = session.getSkill();

        Integer participantCount = null;

        List<SessionParticipantResponse> participants =
                List.of();

        if (session.getSessionType() == SessionType.GROUP) {

            participantCount =
                    Math.toIntExact(
                            sessionParticipantRepository
                                    .countBySessionIdAndStatus(
                                            session.getId(),
                                            ParticipantStatus.JOINED
                                    )
                    );

            participants =
                    sessionParticipantRepository
                            .findBySessionIdOrderByJoinedAtAsc(
                                    session.getId()
                            )
                            .stream()
                            .map(this::toParticipantDto)
                            .toList();
        }

        return SessionResponse.builder()

                .id(session.getId())

                .learnerId(
                        learner != null
                                ? learner.getId()
                                : null
                )

                .learnerName(
                        learner != null
                                ? learner.getFullName()
                                : null
                )

                .learnerProfilePictureUrl(
                        learner != null
                                ? learner.getProfilePictureUrl()
                                : null
                )

                .mentorId(
                        mentor != null
                                ? mentor.getId()
                                : null
                )

                .mentorName(
                        mentor != null
                                ? mentor.getFullName()
                                : null
                )

                .mentorProfilePictureUrl(
                        mentor != null
                                ? mentor.getProfilePictureUrl()
                                : null
                )

                .skillId(
                        skill != null
                                ? skill.getId()
                                : null
                )

                .skillName(
                        skill != null
                                ? skill.getName()
                                : null
                )

                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus())
                .meetingLink(session.getMeetingLink())
                .creditValue(session.getCreditValue())
                .createdAt(session.getCreatedAt())
                .sessionType(session.getSessionType())
                .capacity(session.getCapacity())
                .availabilityId(session.getAvailabilityId())

                .participantCount(participantCount)

                .participants(participants)

                .build();
    }


    private SessionParticipantResponse toParticipantDto(
            SessionParticipant participant) {

        if (participant == null) {
            throw new IllegalArgumentException(
                    "Participant cannot be null."
            );
        }

        User user = participant.getUser();
        User invitedBy = participant.getInvitedBy();

        return SessionParticipantResponse.builder()

                .userId(
                        user != null
                                ? user.getId()
                                : null
                )

                .userName(
                        user != null
                                ? user.getFullName()
                                : null
                )

                .profilePictureUrl(
                        user != null
                                ? user.getProfilePictureUrl()
                                : null
                )

                .status(participant.getStatus())

                .joinedAt(participant.getJoinedAt())

                .invitedByUserId(
                        invitedBy != null
                                ? invitedBy.getId()
                                : null
                )

                .invitedByUserName(
                        invitedBy != null
                                ? invitedBy.getFullName()
                                : null
                )

                .build();
    }


    // =========================================================
    // BOOK SESSION
    // =========================================================

    @Transactional
    public SessionResponse bookSession(
            SessionRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Session request cannot be null."
            );
        }

        User authenticatedUser =
                getAuthenticatedUser();

        /*
         * Group requests are handled separately.
         */
        if (request.getSessionType() == SessionType.GROUP) {

            return requestGroupSession(
                    request,
                    authenticatedUser
            );
        }


        // -----------------------------------------------------
        // INDIVIDUAL VALIDATION
        // -----------------------------------------------------

        if (request.getSkillId() == null) {

            throw new IllegalArgumentException(
                    "Skill is required."
            );
        }

        if (request.getAvailabilityId() == null) {

            throw new IllegalArgumentException(
                    "Availability slot is required."
            );
        }


        Skill skill =
                skillRepository
                        .findById(request.getSkillId())
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Skill not found."
                                )
                        );


        Availability availability =
                availabilityRepository
                        .findById(
                                request.getAvailabilityId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Availability slot not found."
                                )
                        );


        User mentor =
                availability.getUser();


        if (mentor == null) {

            throw new IllegalStateException(
                    "This availability slot has no mentor."
            );
        }


        if (mentor.getId() == null) {

            throw new IllegalStateException(
                    "This availability slot has an invalid mentor."
            );
        }


        // -----------------------------------------------------
        // CANNOT BOOK OWN SLOT
        // -----------------------------------------------------

        if (mentor.getId()
                .equals(authenticatedUser.getId())) {

            throw new IllegalArgumentException(
                    "You cannot book your own availability slot."
            );
        }


        // -----------------------------------------------------
        // SLOT MUST BE FREE
        // -----------------------------------------------------

        if (Boolean.TRUE.equals(
                availability.getIsBooked())) {

            throw new IllegalStateException(
                    "Sorry, this time slot is already booked."
            );
        }


        // -----------------------------------------------------
        // VALIDATE SLOT TIME
        // -----------------------------------------------------

        if (availability.getStartTime() == null
                || availability.getEndTime() == null) {

            throw new IllegalStateException(
                    "This availability slot has invalid time information."
            );
        }

        if (!availability.getStartTime()
                .isBefore(availability.getEndTime())) {

            throw new IllegalStateException(
                    "This availability slot has an invalid time range."
            );
        }

        if (!availability.getStartTime()
                .isAfter(now())) {

            throw new IllegalArgumentException(
                    "This time slot has already started or expired."
            );
        }


        // -----------------------------------------------------
        // DEDUCT INDIVIDUAL CREDITS
        // -----------------------------------------------------

        int deducted =
                userRepository.deductCreditsIfSufficient(
                        authenticatedUser.getId(),
                        INDIVIDUAL_SESSION_COST
                );

        if (deducted != 1) {

            throw new IllegalStateException(
                    "You do not have enough credits to book this session. "
                            + "You need "
                            + INDIVIDUAL_SESSION_COST
                            + " credits."
            );
        }


        // -----------------------------------------------------
        // CREATE SESSION
        // -----------------------------------------------------

        Session session = new Session();

        session.setLearner(authenticatedUser);
        session.setMentor(mentor);
        session.setSkill(skill);

        session.setStartTime(
                availability.getStartTime()
        );

        session.setEndTime(
                availability.getEndTime()
        );

        session.setAvailabilityId(
                availability.getId()
        );

        session.setStatus(
                SessionStatus.PENDING
        );

        session.setSessionType(
                SessionType.INDIVIDUAL
        );

        session.setCreditValue(
                INDIVIDUAL_SESSION_COST
        );


        Session saved =
                sessionRepository.save(session);


        // -----------------------------------------------------
        // ATOMICALLY RESERVE SLOT
        // -----------------------------------------------------

        int reserved =
                availabilityRepository
                        .reserveAvailabilityAtomically(
                                availability.getId(),
                                saved.getId()
                        );

        if (reserved != 1) {

            throw new IllegalStateException(
                    "Sorry, this time slot was booked by someone else."
            );
        }


        // -----------------------------------------------------
        // NOTIFICATION
        // -----------------------------------------------------

        notificationService.sendNotification(
                mentor,
                "New session request from "
                        + authenticatedUser.getFullName()
                        + ".",
                NotificationType.SESSION_UPDATE
        );


        return toDto(saved);
    }


    // =========================================================
    // CREATE GROUP SESSION
    // =========================================================

    @Transactional
    private SessionResponse requestGroupSession(
            SessionRequest request,
            User organizer) {

        if (request.getCapacity() == null) {

            throw new IllegalArgumentException(
                    "Group capacity is required."
            );
        }

        if (request.getCapacity() < MIN_GROUP_CAPACITY
                || request.getCapacity() > MAX_GROUP_CAPACITY) {

            throw new IllegalArgumentException(
                    "Group capacity must be between "
                            + MIN_GROUP_CAPACITY
                            + " and "
                            + MAX_GROUP_CAPACITY
                            + "."
            );
        }

        if (request.getSkillId() == null) {

            throw new IllegalArgumentException(
                    "Skill is required."
            );
        }

        if (request.getAvailabilityId() == null) {

            throw new IllegalArgumentException(
                    "Availability slot is required."
            );
        }


        Skill skill =
                skillRepository
                        .findById(request.getSkillId())
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Skill not found."
                                )
                        );


        Availability availability =
                availabilityRepository
                        .findById(
                                request.getAvailabilityId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Availability slot not found."
                                )
                        );


        User mentor =
                availability.getUser();


        if (mentor == null) {

            throw new IllegalStateException(
                    "This availability slot has no mentor."
            );
        }


        // -----------------------------------------------------
        // ORGANIZER CANNOT BE MENTOR
        // -----------------------------------------------------

        if (mentor.getId()
                .equals(organizer.getId())) {

            throw new IllegalArgumentException(
                    "You cannot create a learner group using your own teaching slot."
            );
        }


        // -----------------------------------------------------
        // SLOT MUST BE FREE
        // -----------------------------------------------------

        if (Boolean.TRUE.equals(
                availability.getIsBooked())) {

            throw new IllegalStateException(
                    "Sorry, this time slot is already booked."
            );
        }


        // -----------------------------------------------------
        // VALIDATE TIME
        // -----------------------------------------------------

        if (availability.getStartTime() == null
                || availability.getEndTime() == null) {

            throw new IllegalStateException(
                    "This availability slot has invalid time information."
            );
        }

        if (!availability.getStartTime()
                .isBefore(availability.getEndTime())) {

            throw new IllegalStateException(
                    "This availability slot has an invalid time range."
            );
        }

        if (!availability.getStartTime()
                .isAfter(now())) {

            throw new IllegalArgumentException(
                    "Group sessions must start in the future."
            );
        }


        // -----------------------------------------------------
        // CREATE GROUP
        // -----------------------------------------------------

        Session session =
                Session.builder()

                        .learner(organizer)

                        .mentor(mentor)

                        .skill(skill)

                        .startTime(
                                availability.getStartTime()
                        )

                        .endTime(
                                availability.getEndTime()
                        )

                        .availabilityId(
                                availability.getId()
                        )

                        .status(
                                SessionStatus.PENDING
                        )

                        .sessionType(
                                SessionType.GROUP
                        )

                        .capacity(
                                request.getCapacity()
                        )

                        /*
                         * IMPORTANT:
                         *
                         * No credits are deducted here.
                         */
                        .creditValue(
                                GROUP_SESSION_TOTAL_COST
                        )

                        .build();


        Session saved =
                sessionRepository.save(session);


        // -----------------------------------------------------
        // RESERVE AVAILABILITY
        // -----------------------------------------------------

        int reserved =
                availabilityRepository
                        .reserveAvailabilityAtomically(
                                availability.getId(),
                                saved.getId()
                        );

        if (reserved != 1) {

            throw new IllegalStateException(
                    "Sorry, this time slot was already taken."
            );
        }


        // -----------------------------------------------------
        // ORGANIZER
        // -----------------------------------------------------

        /*
         * Organizer starts as PENDING because the mentor still
         * needs to approve the learner.
         */
        SessionParticipant organizerParticipant =
                SessionParticipant.builder()
                        .session(saved)
                        .user(organizer)
                        .status(ParticipantStatus.PENDING)
                        .build();

        sessionParticipantRepository.save(
                organizerParticipant
        );


        // -----------------------------------------------------
        // NOTIFY MENTOR
        // -----------------------------------------------------

        notificationService.sendNotification(
                mentor,
                organizer.getFullName()
                        + " requested a group session for "
                        + skill.getName()
                        + ". "
                        + "Approve the learners and then accept the group.",
                NotificationType.SESSION_UPDATE
        );


        return toDto(saved);
    }


    // =========================================================
    // OPEN GROUP SESSIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<SessionResponse> getOpenGroupSessions() {

        LocalDateTime currentTime = now();

        return sessionRepository
                .findBySessionTypeAndStatusInOrderByStartTimeAsc(
                        SessionType.GROUP,
                        List.of(
                                SessionStatus.PENDING,
                                SessionStatus.ACCEPTED
                        )
                )
                .stream()

                .filter(session ->
                        session.getStartTime() != null
                                && session.getStartTime()
                                .isAfter(currentTime)
                )

                .filter(session ->
                        session.getEndTime() != null
                                && session.getStartTime()
                                .isBefore(session.getEndTime())
                )

                .map(this::toDto)

                .toList();
    }


    // =========================================================
    // EXPLORE GROUP SESSIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<SessionResponse> exploreGroupSessions() {

        return sessionRepository
                .findExplorableGroupSessions(
                        List.of(
                                SessionStatus.PENDING,
                                SessionStatus.ACCEPTED
                        ),
                        now()
                )
                .stream()
                .map(this::toDto)
                .toList();
    }


    // =========================================================
    // MY GROUP SESSIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<SessionResponse> getMyGroupSessions() {

        User user =
                getAuthenticatedUser();

        return sessionParticipantRepository
                .findByUserId(user.getId())

                .stream()

                .filter(participant ->
                        participant.getSession() != null
                )

                .filter(participant ->
                        participant.getStatus()
                                == ParticipantStatus.JOINED
                                || participant.getStatus()
                                == ParticipantStatus.INVITED
                                || participant.getStatus()
                                == ParticipantStatus.PENDING
                )

                .map(SessionParticipant::getSession)

                .filter(session ->
                        session != null
                                && session.getSessionType()
                                == SessionType.GROUP
                )

                .distinct()

                .sorted(
                        (a, b) -> {

                            if (a.getStartTime() == null) {
                                return 1;
                            }

                            if (b.getStartTime() == null) {
                                return -1;
                            }

                            return b.getStartTime()
                                    .compareTo(
                                            a.getStartTime()
                                    );
                        }
                )

                .map(this::toDto)

                .toList();
    }


    // =========================================================
    // GET GROUP
    // =========================================================

    @Transactional(readOnly = true)
    public SessionResponse getGroupSession(
            UUID sessionId) {

        validateSessionId(sessionId);

        Session session =
                sessionRepository
                        .findById(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Session not found."
                                )
                        );

        if (session.getSessionType()
                != SessionType.GROUP) {

            throw new IllegalArgumentException(
                    "This is not a group session."
            );
        }

        return toDto(session);
    }


    // =========================================================
    // JOIN GROUP
    // =========================================================

    @Transactional
    public SessionResponse joinGroupSession(
            UUID sessionId) {

        validateSessionId(sessionId);

        User user =
                getAuthenticatedUser();

        Session session =
                sessionRepository
                        .findGroupByIdForUpdate(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Group session not found."
                                )
                        );


        // -----------------------------------------------------
        // SESSION STATE
        // -----------------------------------------------------

        if (session.getStatus()
                != SessionStatus.PENDING
                && session.getStatus()
                != SessionStatus.ACCEPTED) {

            throw new IllegalStateException(
                    "This group session is no longer accepting participants."
            );
        }


        validateFutureSession(session);


        // -----------------------------------------------------
        // MENTOR CANNOT JOIN
        // -----------------------------------------------------

        if (session.getMentor() != null
                && session.getMentor()
                .getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "The mentor is already the host of this group session."
            );
        }


        // -----------------------------------------------------
        // CAPACITY
        // -----------------------------------------------------

        if (session.getCapacity() == null
                || session.getCapacity() < MIN_GROUP_CAPACITY
                || session.getCapacity() > MAX_GROUP_CAPACITY) {

            throw new IllegalStateException(
                    "This group session has an invalid capacity."
            );
        }


        long joinedCount =
                sessionParticipantRepository
                        .countBySessionIdAndStatus(
                                sessionId,
                                ParticipantStatus.JOINED
                        );


        if (joinedCount >= session.getCapacity()) {

            throw new IllegalStateException(
                    "This group session is full ("
                            + joinedCount
                            + "/"
                            + session.getCapacity()
                            + ")."
            );
        }


        // -----------------------------------------------------
        // EXISTING PARTICIPANT
        // -----------------------------------------------------

        SessionParticipant existing =
                sessionParticipantRepository
                        .findBySessionIdAndUserId(
                                sessionId,
                                user.getId()
                        )
                        .orElse(null);


        if (existing != null) {

            if (existing.getStatus()
                    == ParticipantStatus.JOINED) {

                throw new IllegalStateException(
                        "You are already joined in this group session."
                );
            }

            if (existing.getStatus()
                    == ParticipantStatus.PENDING) {

                throw new IllegalStateException(
                        "Your request is already waiting for mentor approval."
                );
            }

            if (existing.getStatus()
                    == ParticipantStatus.INVITED) {

                /*
                 * An invited learner should not create another
                 * request. They should accept the invitation
                 * through the invitation flow.
                 */
                throw new IllegalStateException(
                        "You already have an invitation to this group."
                );
            }

            /*
             * DECLINED or other non-active status:
             * allow the learner to request again.
             */
            existing.setStatus(
                    ParticipantStatus.PENDING
            );

            sessionParticipantRepository.save(
                    existing
            );

        } else {

            SessionParticipant participant =
                    SessionParticipant.builder()
                            .session(session)
                            .user(user)
                            .status(ParticipantStatus.PENDING)
                            .build();

            sessionParticipantRepository.save(
                    participant
            );
        }


        // -----------------------------------------------------
        // NOTIFY MENTOR
        // -----------------------------------------------------

        notificationService.sendNotification(
                session.getMentor(),
                user.getFullName()
                        + " requested to join your group session.",
                NotificationType.SESSION_UPDATE
        );


        return toDto(session);
    }


    // =========================================================
    // DECLINE INVITATION
    // =========================================================

    @Transactional
    public SessionResponse declineGroupInvitation(
            UUID sessionId) {

        validateSessionId(sessionId);

        User user =
                getAuthenticatedUser();

        Session session =
                sessionRepository
                        .findGroupByIdForUpdate(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Group session not found."
                                )
                        );


        SessionParticipant participant =
                sessionParticipantRepository
                        .findBySessionIdAndUserId(
                                sessionId,
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "You do not have an invitation to this group."
                                )
                        );


        if (participant.getStatus()
                != ParticipantStatus.INVITED) {

            throw new IllegalStateException(
                    "There is no pending invitation to decline."
            );
        }


        participant.setStatus(
                ParticipantStatus.DECLINED
        );

        sessionParticipantRepository.save(
                participant
        );


        if (session.getMentor() != null) {

            notificationService.sendNotification(
                    session.getMentor(),
                    user.getFullName()
                            + " declined your group-session invitation.",
                    NotificationType.SESSION_UPDATE
            );
        }


        return toDto(session);
    }


    // =========================================================
    // LEAVE GROUP
    // =========================================================

    /**
     * IMPORTANT:
     *
     * Leaving a group does NOT refund or reduce credits.
     *
     * Group credits are only charged at completion.
     */
    @Transactional
    public SessionResponse leaveGroupSession(
            UUID sessionId) {

        validateSessionId(sessionId);

        User user =
                getAuthenticatedUser();

        Session session =
                sessionRepository
                        .findGroupByIdForUpdate(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Group session not found."
                                )
                        );


        validateFutureSession(session);


        if (session.getMentor() != null
                && session.getMentor()
                .getId()
                .equals(user.getId())) {

            throw new IllegalStateException(
                    "The mentor cannot leave the group. "
                            + "Cancel the group session instead."
            );
        }


        SessionParticipant participant =
                sessionParticipantRepository
                        .findBySessionIdAndUserId(
                                sessionId,
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "You are not a participant in this group."
                                )
                        );


        ParticipantStatus currentStatus =
                participant.getStatus();


        if (currentStatus != ParticipantStatus.JOINED
                && currentStatus != ParticipantStatus.PENDING
                && currentStatus != ParticipantStatus.INVITED) {

            throw new IllegalStateException(
                    "You cannot leave this participant record."
            );
        }


        /*
         * NO CREDIT OPERATION HERE.
         */
        sessionParticipantRepository.delete(
                participant
        );


        if (session.getMentor() != null) {

            notificationService.sendNotification(
                    session.getMentor(),
                    user.getFullName()
                            + " left the group session.",
                    NotificationType.SESSION_UPDATE
            );
        }


        return toDto(session);
    }


    // =========================================================
    // REMOVE GROUP PARTICIPANT
    // =========================================================

    @Transactional
    public SessionResponse removeGroupParticipant(
            UUID sessionId,
            UUID userId) {

        validateSessionId(sessionId);
        validateUserId(userId);

        User mentor =
                getAuthenticatedUser();

        Session session =
                sessionRepository
                        .findGroupByIdForUpdate(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Group session not found."
                                )
                        );


        if (session.getMentor() == null
                || !session.getMentor()
                .getId()
                .equals(mentor.getId())) {

            throw new UnauthorizedAccessException(
                    "Only the group host can remove participants."
            );
        }


        if (mentor.getId().equals(userId)) {

            throw new IllegalArgumentException(
                    "The host cannot be removed."
            );
        }


        SessionParticipant participant =
                sessionParticipantRepository
                        .findBySessionIdAndUserId(
                                sessionId,
                                userId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Participant not found."
                                )
                        );


        User removedUser =
                participant.getUser();


        sessionParticipantRepository.delete(
                participant
        );


        if (removedUser != null) {

            notificationService.sendNotification(
                    removedUser,
                    "You were removed from the group session hosted by "
                            + mentor.getFullName()
                            + ".",
                    NotificationType.SESSION_UPDATE
            );
        }


        return toDto(session);
    }


    // =========================================================
    // INVITE FRIEND
    // =========================================================

    @Transactional
    public SessionResponse inviteToGroupSession(
            UUID sessionId,
            UUID userId) {

        validateSessionId(sessionId);
        validateUserId(userId);

        User inviter =
                getAuthenticatedUser();

        Session session =
                sessionRepository
                        .findGroupByIdForUpdate(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Group session not found."
                                )
                        );


        // -----------------------------------------------------
        // ACTIVE GROUP
        // -----------------------------------------------------

        if (session.getStatus()
                != SessionStatus.PENDING
                && session.getStatus()
                != SessionStatus.ACCEPTED) {

            throw new IllegalStateException(
                    "This group session is no longer accepting participants."
            );
        }


        validateFutureSession(session);


        // -----------------------------------------------------
        // SELF INVITE
        // -----------------------------------------------------

        if (userId.equals(inviter.getId())) {

            throw new IllegalArgumentException(
                    "You cannot invite yourself."
            );
        }


        // -----------------------------------------------------
        // MENTOR CANNOT BE INVITED
        // -----------------------------------------------------

        if (session.getMentor() != null
                && session.getMentor()
                .getId()
                .equals(userId)) {

            throw new IllegalArgumentException(
                    "The mentor is already the host of this group."
            );
        }


        // -----------------------------------------------------
        // AUTHORIZATION
        // -----------------------------------------------------

        boolean isMentor =
                session.getMentor() != null
                        && session.getMentor()
                        .getId()
                        .equals(inviter.getId());

        boolean isOrganizer =
                session.getLearner() != null
                        && session.getLearner()
                        .getId()
                        .equals(inviter.getId());

        boolean isJoinedParticipant =
                sessionParticipantRepository
                        .findBySessionIdAndUserId(
                                sessionId,
                                inviter.getId()
                        )
                        .filter(participant ->
                                participant.getStatus()
                                        == ParticipantStatus.JOINED
                        )
                        .isPresent();


        if (!isMentor
                && !isOrganizer
                && !isJoinedParticipant) {

            throw new UnauthorizedAccessException(
                    "Only the mentor, organizer, or a joined "
                            + "participant can invite friends."
            );
        }


        // -----------------------------------------------------
        // CAPACITY
        // -----------------------------------------------------

        if (session.getCapacity() == null) {

            throw new IllegalStateException(
                    "Group capacity is not configured."
            );
        }


        long joinedCount =
                sessionParticipantRepository
                        .countBySessionIdAndStatus(
                                sessionId,
                                ParticipantStatus.JOINED
                        );


        if (joinedCount >= session.getCapacity()) {

            throw new IllegalStateException(
                    "This group session is full."
            );
        }


        // -----------------------------------------------------
        // INVITEE
        // -----------------------------------------------------

        User invitee =
                userRepository
                        .findById(userId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "User not found."
                                )
                        );


        // -----------------------------------------------------
        // FRIENDSHIP
        // -----------------------------------------------------

        Connection connection =
                connectionRepository
                        .findExistingConnection(
                                inviter.getId(),
                                userId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "You can invite accepted friends only."
                                )
                        );


        if (connection.getStatus()
                != ConnectionStatus.ACCEPTED) {

            throw new IllegalArgumentException(
                    "You can invite accepted friends only."
            );
        }


        // -----------------------------------------------------
        // EXISTING PARTICIPANT
        // -----------------------------------------------------

        SessionParticipant existing =
                sessionParticipantRepository
                        .findBySessionIdAndUserId(
                                sessionId,
                                userId
                        )
                        .orElse(null);


        if (existing != null) {

            if (existing.getStatus()
                    == ParticipantStatus.JOINED) {

                throw new IllegalStateException(
                        "This user has already joined the group."
                );
            }

            if (existing.getStatus()
                    == ParticipantStatus.PENDING) {

                throw new IllegalStateException(
                        "This user already has a pending join request."
                );
            }

            if (existing.getStatus()
                    == ParticipantStatus.INVITED) {

                throw new IllegalStateException(
                        "This user is already invited."
                );
            }

            existing.setStatus(
                    ParticipantStatus.INVITED
            );

            existing.setInvitedBy(
                    inviter
            );

            sessionParticipantRepository.save(
                    existing
            );

        } else {

            SessionParticipant participant =
                    SessionParticipant.builder()
                            .session(session)
                            .user(invitee)
                            .invitedBy(inviter)
                            .status(ParticipantStatus.INVITED)
                            .build();

            sessionParticipantRepository.save(
                    participant
            );
        }


        // -----------------------------------------------------
        // NOTIFY
        // -----------------------------------------------------

        notificationService.sendNotification(
                invitee,
                inviter.getFullName()
                        + " invited you to join the "
                        + session.getSkill().getName()
                        + " group session.",
                NotificationType.SESSION_UPDATE
        );


        return toDto(session);
    }


    // =========================================================
    // APPROVE GROUP PARTICIPANT
    // =========================================================

    @Transactional
    public SessionResponse updateGroupParticipantStatus(
            UUID sessionId,
            UUID userId,
            ParticipantStatus status) {

        validateSessionId(sessionId);
        validateUserId(userId);

        if (status == null) {

            throw new IllegalArgumentException(
                    "Participant status is required."
            );
        }


        User mentor =
                getAuthenticatedUser();

        Session session =
                sessionRepository
                        .findGroupByIdForUpdate(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Group session not found."
                                )
                        );


        // -----------------------------------------------------
        // MENTOR ONLY
        // -----------------------------------------------------

        if (session.getMentor() == null
                || !session.getMentor()
                .getId()
                .equals(mentor.getId())) {

            throw new UnauthorizedAccessException(
                    "Only the mentor can approve group learners."
            );
        }


        // -----------------------------------------------------
        // ONLY APPROVAL SUPPORTED
        // -----------------------------------------------------

        if (status != ParticipantStatus.JOINED) {

            throw new IllegalArgumentException(
                    "The mentor can approve a learner using JOINED status. "
                            + "To remove or reject a learner, remove the participant."
            );
        }


        // -----------------------------------------------------
        // GROUP ACTIVE
        // -----------------------------------------------------

        if (session.getStatus()
                != SessionStatus.PENDING
                && session.getStatus()
                != SessionStatus.ACCEPTED) {

            throw new IllegalStateException(
                    "This group session is no longer accepting participants."
            );
        }


        validateFutureSession(session);


        // -----------------------------------------------------
        // FIND PARTICIPANT
        // -----------------------------------------------------

        SessionParticipant participant =
                sessionParticipantRepository
                        .findBySessionIdAndUserId(
                                sessionId,
                                userId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Participant not found."
                                )
                        );


        if (participant.getStatus()
                != ParticipantStatus.PENDING) {

            throw new IllegalStateException(
                    "Only pending learners can be approved."
            );
        }


        // -----------------------------------------------------
        // CAPACITY
        // -----------------------------------------------------

        long joinedCount =
                sessionParticipantRepository
                        .countBySessionIdAndStatus(
                                sessionId,
                                ParticipantStatus.JOINED
                        );


        if (session.getCapacity() == null
                || joinedCount >= session.getCapacity()) {

            throw new IllegalStateException(
                    "This group session is full."
            );
        }


        // -----------------------------------------------------
        // APPROVE
        // -----------------------------------------------------

        participant.setStatus(
                ParticipantStatus.JOINED
        );

        sessionParticipantRepository.save(
                participant
        );


        // -----------------------------------------------------
        // NOTIFY LEARNER
        // -----------------------------------------------------

        notificationService.sendNotification(
                participant.getUser(),
                "The mentor approved your request. "
                        + "You are now officially joined in the group session.",
                NotificationType.SESSION_UPDATE
        );


        return toDto(session);
    }


    // =========================================================
    // ACCEPT / REJECT INDIVIDUAL OR ACCEPT GROUP
    // =========================================================

    @Transactional
    public SessionResponse updateSessionStatus(
            UUID sessionId,
            SessionStatus newStatus) {

        validateSessionId(sessionId);

        if (newStatus == null) {

            throw new IllegalArgumentException(
                    "New session status is required."
            );
        }


        User mentor =
                getAuthenticatedUser();

        Session session =
                sessionRepository
                        .findById(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Session not found."
                                )
                        );


        if (session.getMentor() == null
                || !session.getMentor()
                .getId()
                .equals(mentor.getId())) {

            throw new UnauthorizedAccessException(
                    "Only the assigned mentor can update this session."
            );
        }


        // =====================================================
        // GROUP
        // =====================================================

        if (session.getSessionType()
                == SessionType.GROUP) {

            if (newStatus != SessionStatus.ACCEPTED) {

                throw new IllegalArgumentException(
                        "A group session can only be accepted here."
                );
            }


            if (session.getStatus()
                    != SessionStatus.PENDING) {

                throw new IllegalStateException(
                        "This group session has already been processed."
                );
            }


            validateFutureSession(session);


            long joinedCount =
                    sessionParticipantRepository
                            .countBySessionIdAndStatus(
                                    sessionId,
                                    ParticipantStatus.JOINED
                            );


            if (joinedCount == 0) {

                throw new IllegalStateException(
                        "At least one learner must be approved "
                                + "before the group can be accepted."
                );
            }


            int updated =
                    sessionRepository
                            .transitionSessionStatusAtomically(
                                    sessionId,
                                    SessionStatus.ACCEPTED,
                                    List.of(
                                            SessionStatus.PENDING
                                    )
                            );


            if (updated != 1) {

                throw new IllegalStateException(
                        "The group session could not be accepted."
                );
            }


            session.setStatus(
                    SessionStatus.ACCEPTED
            );


            Session saved =
                    sessionRepository.save(session);


            List<SessionParticipant> joined =
                    sessionParticipantRepository
                            .findBySessionIdOrderByJoinedAtAsc(
                                    sessionId
                            )
                            .stream()
                            .filter(participant ->
                                    participant.getStatus()
                                            == ParticipantStatus.JOINED
                            )
                            .toList();


            for (SessionParticipant participant :
                    joined) {

                notificationService.sendNotification(
                        participant.getUser(),
                        "The mentor accepted the group session.",
                        NotificationType.SESSION_UPDATE
                );
            }


            return toDto(saved);
        }


        // =====================================================
        // INDIVIDUAL
        // =====================================================

        if (newStatus != SessionStatus.ACCEPTED
                && newStatus != SessionStatus.REJECTED) {

            throw new IllegalArgumentException(
                    "An individual session can only be accepted or rejected."
            );
        }


        if (session.getStatus()
                != SessionStatus.PENDING) {

            throw new IllegalStateException(
                    "This session is no longer pending."
            );
        }


        // -----------------------------------------------------
        // ACCEPTANCE EXPIRATION CHECK
        // -----------------------------------------------------

        if (newStatus == SessionStatus.ACCEPTED) {

            LocalDateTime currentTime =
                    now();

            if (session.getStartTime() == null
                    || !currentTime.isBefore(
                    session.getStartTime()
            )) {

                throw new IllegalStateException(
                        "This session request has expired."
                );
            }


            LocalDateTime timeoutThreshold =
                    currentTime.minusHours(
                            sessionProperties
                                    .getPendingResponseTimeoutHours()
                    );


            if (session.getCreatedAt() != null
                    && session.getCreatedAt()
                    .isBefore(timeoutThreshold)) {

                throw new IllegalStateException(
                        "This session request has expired."
                );
            }
        }


        // -----------------------------------------------------
        // ATOMIC STATE CHANGE
        // -----------------------------------------------------

        int updated =
                sessionRepository
                        .transitionSessionStatusAtomically(
                                sessionId,
                                newStatus,
                                List.of(
                                        SessionStatus.PENDING
                                )
                        );


        if (updated != 1) {

            throw new IllegalStateException(
                    "This session was already processed."
            );
        }


        session.setStatus(
                newStatus
        );


        // =====================================================
        // ACCEPTED
        // =====================================================

        if (newStatus == SessionStatus.ACCEPTED) {

            notificationService.sendNotification(
                    session.getLearner(),
                    "Your session with "
                            + session.getMentor().getFullName()
                            + " was accepted.",
                    NotificationType.SESSION_UPDATE
            );
        }


        // =====================================================
        // REJECTED
        // =====================================================

        else {

            /*
             * The learner already paid 10 when booking.
             * Therefore rejection gives all 10 back.
             */
            userRepository.addCreditsAtomically(
                    session.getLearner().getId(),
                    INDIVIDUAL_SESSION_COST
            );


            releaseAvailability(
                    session.getAvailabilityId(),
                    session.getId()
            );


            notificationService.sendNotification(
                    session.getLearner(),
                    "Your session request was declined. "
                            + "Your "
                            + INDIVIDUAL_SESSION_COST
                            + " credits have been refunded.",
                    NotificationType.SESSION_UPDATE
            );
        }


        Session saved =
                sessionRepository.save(session);

        return toDto(saved);
    }


    // =========================================================
    // CANCEL SESSION
    // =========================================================

    @Transactional
    public SessionResponse cancelSession(
            UUID sessionId) {

        validateSessionId(sessionId);

        User cancelingUser =
                getAuthenticatedUser();

        Session session =
                sessionRepository
                        .findById(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Session not found."
                                )
                        );


        // =====================================================
        // GROUP
        // =====================================================

        if (session.getSessionType()
                == SessionType.GROUP) {

            if (session.getMentor() == null
                    || !session.getMentor()
                    .getId()
                    .equals(cancelingUser.getId())) {

                throw new UnauthorizedAccessException(
                        "Only the mentor can cancel the group session."
                );
            }


            validateFutureSession(session);


            if (session.getStatus()
                    != SessionStatus.PENDING
                    && session.getStatus()
                    != SessionStatus.ACCEPTED) {

                throw new IllegalStateException(
                        "This group session cannot be cancelled."
                );
            }


            int updated =
                    sessionRepository
                            .transitionSessionStatusAtomically(
                                    sessionId,
                                    SessionStatus.CANCELLED,
                                    List.of(
                                            SessionStatus.PENDING,
                                            SessionStatus.ACCEPTED
                                    )
                            );


            if (updated != 1) {

                throw new IllegalStateException(
                        "The group session was already processed."
                );
            }


            /*
             * No credits are involved in group cancellation
             * because group credits are charged only at completion.
             */
            releaseAvailability(
                    session.getAvailabilityId(),
                    session.getId()
            );


            session.setStatus(
                    SessionStatus.CANCELLED
            );


            List<SessionParticipant> participants =
                    sessionParticipantRepository
                            .findBySessionIdOrderByJoinedAtAsc(
                                    sessionId
                            );


            for (SessionParticipant participant :
                    participants) {

                if (participant.getUser() != null
                        && !participant.getUser()
                        .getId()
                        .equals(cancelingUser.getId())) {

                    notificationService.sendNotification(
                            participant.getUser(),
                            "The group session hosted by "
                                    + cancelingUser.getFullName()
                                    + " was cancelled. "
                                    + "No credits were charged.",
                            NotificationType.SESSION_UPDATE
                    );
                }
            }


            return toDto(
                    sessionRepository.save(session)
            );
        }


        // =====================================================
        // INDIVIDUAL
        // =====================================================

        if (session.getStatus()
                != SessionStatus.PENDING
                && session.getStatus()
                != SessionStatus.ACCEPTED) {

            throw new IllegalStateException(
                    "You can only cancel pending or accepted sessions."
            );
        }


        validateFutureSession(session);


        User learner =
                session.getLearner();

        User mentor =
                session.getMentor();


        if (learner == null || mentor == null) {

            throw new IllegalStateException(
                    "Session has invalid learner or mentor information."
            );
        }


        boolean isLearner =
                learner.getId()
                        .equals(cancelingUser.getId());

        boolean isMentor =
                mentor.getId()
                        .equals(cancelingUser.getId());


        if (!isLearner && !isMentor) {

            throw new UnauthorizedAccessException(
                    "You are not a participant in this session."
            );
        }


        SessionStatus oldStatus =
                session.getStatus();


        // -----------------------------------------------------
        // ATOMIC CANCEL
        // -----------------------------------------------------

        int updated =
                sessionRepository
                        .transitionSessionStatusAtomically(
                                sessionId,
                                SessionStatus.CANCELLED,
                                List.of(oldStatus)
                        );


        if (updated != 1) {

            throw new IllegalStateException(
                    "This session was already cancelled or processed."
            );
        }


        // =====================================================
        // LEARNER CANCELS
        // =====================================================

        if (isLearner) {

            if (oldStatus == SessionStatus.PENDING) {

                /*
                 * Pending learner:
                 * full 10-credit refund.
                 */
                userRepository.addCreditsAtomically(
                        learner.getId(),
                        INDIVIDUAL_SESSION_COST
                );


                notificationService.sendNotification(
                        mentor,
                        "The learner cancelled the session request.",
                        NotificationType.SESSION_UPDATE
                );


                notificationService.sendNotification(
                        learner,
                        "You cancelled the session request. "
                                + "Your full "
                                + INDIVIDUAL_SESSION_COST
                                + " credits were refunded.",
                        NotificationType.SESSION_UPDATE
                );

            } else {

                /*
                 * Accepted learner cancellation:
                 *
                 * Learner gets 5 back.
                 * Mentor gets 5 compensation.
                 */
                int learnerRefund =
                        INDIVIDUAL_SESSION_COST
                                - CANCELLATION_PENALTY;


                userRepository.addCreditsAtomically(
                        learner.getId(),
                        learnerRefund
                );


                userRepository.addCreditsAtomically(
                        mentor.getId(),
                        CANCELLATION_PENALTY
                );


                notificationService.sendNotification(
                        mentor,
                        "The learner cancelled the accepted session. "
                                + "You received "
                                + CANCELLATION_PENALTY
                                + " credits compensation.",
                        NotificationType.SESSION_UPDATE
                );


                notificationService.sendNotification(
                        learner,
                        "You cancelled the accepted session. "
                                + learnerRefund
                                + " credits were refunded. "
                                + CANCELLATION_PENALTY
                                + " credits were charged as the cancellation penalty.",
                        NotificationType.SESSION_UPDATE
                );
            }
        }


        // =====================================================
        // MENTOR CANCELS
        // =====================================================

        else {

            if (oldStatus == SessionStatus.PENDING) {

                /*
                 * Mentor cancels pending request:
                 * learner receives full refund.
                 */
                userRepository.addCreditsAtomically(
                        learner.getId(),
                        INDIVIDUAL_SESSION_COST
                );


                notificationService.sendNotification(
                        learner,
                        "The mentor cancelled the session request. "
                                + "Your full "
                                + INDIVIDUAL_SESSION_COST
                                + " credits were refunded.",
                        NotificationType.SESSION_UPDATE
                );


                notificationService.sendNotification(
                        mentor,
                        "You cancelled the pending session request. "
                                + "No penalty was applied.",
                        NotificationType.SESSION_UPDATE
                );

            } else {

                /*
                 * Mentor cancels accepted session:
                 *
                 * Learner gets:
                 * 10 original refund + 5 compensation = 15
                 *
                 * Mentor:
                 * 5 deducted, or debt created if insufficient.
                 */
                userRepository.addCreditsAtomically(
                        learner.getId(),
                        INDIVIDUAL_SESSION_COST
                                + CANCELLATION_PENALTY
                );


                int deducted =
                        userRepository
                                .deductCreditsIfSufficient(
                                        mentor.getId(),
                                        CANCELLATION_PENALTY
                                );


                if (deducted == 1) {

                    notificationService.sendNotification(
                            mentor,
                            "You cancelled the accepted session. "
                                    + CANCELLATION_PENALTY
                                    + " credits were charged as a penalty.",
                            NotificationType.SESSION_UPDATE
                    );

                } else {

                    CreditDebt debt =
                            CreditDebt.builder()
                                    .mentor(mentor)
                                    .session(session)
                                    .amount(
                                            CANCELLATION_PENALTY
                                    )
                                    .status(
                                            DebtStatus.UNPAID
                                    )
                                    .build();


                    creditDebtRepository.save(
                            debt
                    );


                    notificationService.sendNotification(
                            mentor,
                            "You cancelled the accepted session. "
                                    + "Your balance was insufficient, so an unpaid debt of "
                                    + CANCELLATION_PENALTY
                                    + " credits was recorded.",
                            NotificationType.SESSION_UPDATE
                    );
                }


                notificationService.sendNotification(
                        learner,
                        "The mentor cancelled the accepted session. "
                                + "You received "
                                + (INDIVIDUAL_SESSION_COST
                                + CANCELLATION_PENALTY)
                                + " credits.",
                        NotificationType.SESSION_UPDATE
                );
            }
        }


        // -----------------------------------------------------
        // RELEASE AVAILABILITY
        // -----------------------------------------------------

        releaseAvailability(
                session.getAvailabilityId(),
                session.getId()
        );


        session.setStatus(
                SessionStatus.CANCELLED
        );


        return toDto(
                sessionRepository.save(session)
        );
    }


    // =========================================================
    // COMPLETE SESSION
    // =========================================================

    @Transactional
    public SessionResponse completeSession(
            UUID sessionId) {

        validateSessionId(sessionId);

        User authenticatedUser =
                getAuthenticatedUser();

        Session session =
                sessionRepository
                        .findById(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Session not found."
                                )
                        );


        // =====================================================
        // GROUP
        // =====================================================

        if (session.getSessionType()
                == SessionType.GROUP) {

            if (session.getMentor() == null
                    || !session.getMentor()
                    .getId()
                    .equals(authenticatedUser.getId())) {

                throw new UnauthorizedAccessException(
                        "Only the mentor can complete a group session."
                );
            }


            if (session.getStatus()
                    != SessionStatus.ACCEPTED) {

                throw new IllegalStateException(
                        "Only accepted group sessions can be completed."
                );
            }


            if (session.getEndTime() == null
                    || now().isBefore(
                    session.getEndTime()
            )) {

                throw new IllegalStateException(
                        "The group session has not ended yet."
                );
            }


            List<SessionParticipant> joined =
                    sessionParticipantRepository
                            .findBySessionIdOrderByJoinedAtAsc(
                                    sessionId
                            )
                            .stream()
                            .filter(participant ->
                                    participant.getStatus()
                                            == ParticipantStatus.JOINED
                            )
                            .toList();


            if (joined.isEmpty()) {

                throw new IllegalStateException(
                        "A group session cannot be completed "
                                + "without joined learners."
                );
            }


            int learnerCount =
                    joined.size();


            if (learnerCount > MAX_GROUP_CAPACITY) {

                throw new IllegalStateException(
                        "Invalid group participant count."
                );
            }


            // -------------------------------------------------
            // SPLIT TOTAL 10
            // -------------------------------------------------

            int baseShare =
                    GROUP_SESSION_TOTAL_COST
                            / learnerCount;

            int remainder =
                    GROUP_SESSION_TOTAL_COST
                            % learnerCount;


            /*
             * Example:
             *
             * 2 -> 5, 5
             * 3 -> 4, 3, 3
             * 4 -> 3, 3, 2, 2
             * 5 -> 2, 2, 2, 2, 2
             */
            for (int i = 0;
                 i < learnerCount;
                 i++) {

                SessionParticipant participant =
                        joined.get(i);


                int share =
                        baseShare
                                + (i < remainder
                                ? 1
                                : 0);


                int deducted =
                        userRepository
                                .deductCreditsIfSufficient(
                                        participant
                                                .getUser()
                                                .getId(),
                                        share
                                );


                if (deducted != 1) {

                    throw new IllegalStateException(
                            participant.getUser()
                                    .getFullName()
                                    + " does not have enough credits. "
                                    + share
                                    + " credits are required."
                    );
                }
            }


            // -------------------------------------------------
            // PAY MENTOR
            // -------------------------------------------------

            userRepository.addCreditsAtomically(
                    authenticatedUser.getId(),
                    GROUP_SESSION_TOTAL_COST
            );


            // -------------------------------------------------
            // COMPLETE ATOMICALLY
            // -------------------------------------------------

            int updated =
                    sessionRepository
                            .transitionSessionStatusAtomically(
                                    sessionId,
                                    SessionStatus.COMPLETED,
                                    List.of(
                                            SessionStatus.ACCEPTED
                                    )
                            );


            if (updated != 1) {

                throw new IllegalStateException(
                        "The group session was already completed."
                );
            }


            session.setStatus(
                    SessionStatus.COMPLETED
            );


            Session saved =
                    sessionRepository.save(session);


            // -------------------------------------------------
            // XP + NOTIFICATIONS
            // -------------------------------------------------

            for (SessionParticipant participant :
                    joined) {

                gamificationService
                        .awardSessionCompletionXp(
                                participant.getUser()
                        );

                notificationService.sendNotification(
                        participant.getUser(),
                        "Your group session has been completed.",
                        NotificationType.SESSION_UPDATE
                );
            }


            gamificationService
                    .awardSessionCompletionXp(
                            authenticatedUser
                    );


            /*
             * Release the slot after completion.
             */
            releaseAvailability(
                    session.getAvailabilityId(),
                    session.getId()
            );


            return toDto(saved);
        }


        // =====================================================
        // INDIVIDUAL
        // =====================================================

        if (session.getStatus()
                != SessionStatus.ACCEPTED) {

            throw new IllegalStateException(
                    "Only accepted sessions can be completed."
            );
        }


        if (session.getEndTime() == null
                || now().isBefore(
                session.getEndTime()
        )) {

            throw new IllegalStateException(
                    "The session has not ended yet."
            );
        }


        if (session.getLearner() == null
                || !session.getLearner()
                .getId()
                .equals(authenticatedUser.getId())) {

            throw new UnauthorizedAccessException(
                    "Only the learner can complete an individual session."
            );
        }


        // -----------------------------------------------------
        // ATOMIC COMPLETION
        // -----------------------------------------------------

        int updated =
                sessionRepository
                        .transitionSessionStatusAtomically(
                                sessionId,
                                SessionStatus.COMPLETED,
                                List.of(
                                        SessionStatus.ACCEPTED
                                )
                        );


        if (updated != 1) {

            throw new IllegalStateException(
                    "This session was already completed."
            );
        }


        User learner =
                session.getLearner();

        User mentor =
                session.getMentor();


        /*
         * Learner already paid 10 during booking.
         * Mentor receives the 10 after completion.
         */
        userRepository.addCreditsAtomically(
                mentor.getId(),
                INDIVIDUAL_SESSION_COST
        );


        gamificationService
                .awardSessionCompletionXp(
                        learner
                );

        gamificationService
                .awardSessionCompletionXp(
                        mentor
                );


        notificationService.sendNotification(
                learner,
                "Your session with "
                        + mentor.getFullName()
                        + " has been completed.",
                NotificationType.MESSAGE
        );


        notificationService.sendNotification(
                mentor,
                "Your session with "
                        + learner.getFullName()
                        + " has been completed.",
                NotificationType.MESSAGE
        );


        /*
         * Individual availability is released after completion.
         */
        releaseAvailability(
                session.getAvailabilityId(),
                session.getId()
        );


        session.setStatus(
                SessionStatus.COMPLETED
        );


        return toDto(
                sessionRepository.save(session)
        );
    }


    // =========================================================
    // LEARNER SESSIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<SessionResponse> getLearnerSessions(
            UUID learnerId) {

        validateUserId(learnerId);

        User authenticatedUser =
                getAuthenticatedUser();


        if (!authenticatedUser.getId()
                .equals(learnerId)) {

            throw new UnauthorizedAccessException(
                    "You can only view your own sessions."
            );
        }


        return sessionRepository
                .findByLearnerId(learnerId)
                .stream()
                .map(this::toDto)
                .toList();
    }


    // =========================================================
    // MENTOR SESSIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<SessionResponse> getMentorSessions(
            UUID mentorId) {

        validateUserId(mentorId);

        User authenticatedUser =
                getAuthenticatedUser();


        if (!authenticatedUser.getId()
                .equals(mentorId)) {

            throw new UnauthorizedAccessException(
                    "You can only view your own mentor schedule."
            );
        }


        return sessionRepository
                .findByMentorId(mentorId)
                .stream()
                .map(this::toDto)
                .toList();
    }


    // =========================================================
    // EXPIRATION ENGINE
    // =========================================================

    public int expireOverdueSessions() {

        LocalDateTime currentTime =
                now();


        LocalDateTime timeoutThreshold =
                currentTime.minusHours(
                        sessionProperties
                                .getPendingResponseTimeoutHours()
                );


        Pageable pendingPageable =
                PageRequest.of(
                        0,
                        EXPIRATION_BATCH_SIZE,
                        Sort.by("createdAt")
                                .ascending()
                );


        List<Session> expiredPending =
                sessionRepository
                        .findPendingSessionsForExpiration(
                                SessionStatus.PENDING,
                                currentTime,
                                timeoutThreshold,
                                pendingPageable
                        );


        int successfulCount = 0;


        for (Session session :
                expiredPending) {

            try {

                if (sessionExpirationProcessor
                        .processPendingExpiration(
                                session.getId()
                        )) {

                    successfulCount++;
                }

            } catch (Exception e) {

                log.error(
                        "Failed to expire pending session {}",
                        session.getId(),
                        e
                );
            }
        }


        Pageable acceptedPageable =
                PageRequest.of(
                        0,
                        EXPIRATION_BATCH_SIZE,
                        Sort.by("endTime")
                                .ascending()
                );


        List<Session> acceptedPastEnd =
                sessionRepository
                        .findByStatusInAndEndTimeBefore(
                                Arrays.asList(
                                        SessionStatus.ACCEPTED
                                ),
                                currentTime,
                                acceptedPageable
                        );


        for (Session session :
                acceptedPastEnd) {

            try {

                if (sessionExpirationProcessor
                        .processAcceptedCompletion(
                                session.getId()
                        )) {

                    successfulCount++;
                }

            } catch (Exception e) {

                log.error(
                        "Failed to complete overdue session {}",
                        session.getId(),
                        e
                );
            }
        }


        return successfulCount;
    }


    // =========================================================
    // MEETING LINK
    // =========================================================

    @Transactional
    public SessionResponse addMeetingLink(
            UUID sessionId,
            String meetingLink) {

        validateSessionId(sessionId);

        User mentor =
                getAuthenticatedUser();


        if (meetingLink == null
                || meetingLink.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Meeting link cannot be empty."
            );
        }


        Session session =
                sessionRepository
                        .findById(sessionId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Session not found."
                                )
                        );


        if (session.getMentor() == null
                || !session.getMentor()
                .getId()
                .equals(mentor.getId())) {

            throw new UnauthorizedAccessException(
                    "Only the assigned mentor can add a meeting link."
            );
        }


        if (session.getStatus()
                == SessionStatus.CANCELLED
                || session.getStatus()
                == SessionStatus.COMPLETED) {

            throw new IllegalStateException(
                    "Cannot add a meeting link to a closed session."
            );
        }


        session.setMeetingLink(
                meetingLink.trim()
        );


        Session saved =
                sessionRepository.save(session);


        String message =
                "Your mentor, "
                        + mentor.getFullName()
                        + ", has posted the meeting link for your session.";


        // -----------------------------------------------------
        // GROUP
        // -----------------------------------------------------

        if (session.getSessionType()
                == SessionType.GROUP) {

            List<SessionParticipant> participants =
                    sessionParticipantRepository
                            .findBySessionIdOrderByJoinedAtAsc(
                                    sessionId
                            );


            for (SessionParticipant participant :
                    participants) {

                if (participant.getStatus()
                        == ParticipantStatus.JOINED
                        && participant.getUser() != null) {

                    notificationService.sendNotification(
                            participant.getUser(),
                            message,
                            NotificationType.SESSION_UPDATE
                    );
                }
            }
        }


        // -----------------------------------------------------
        // INDIVIDUAL
        // -----------------------------------------------------

        else if (session.getLearner() != null) {

            notificationService.sendNotification(
                    session.getLearner(),
                    message,
                    NotificationType.SESSION_UPDATE
            );
        }


        return toDto(saved);
    }


    // =========================================================
    // RELEASE AVAILABILITY
    // =========================================================

    private void releaseAvailability(
            UUID availabilityId,
            UUID sessionId) {

        if (availabilityId == null) {

            log.warn(
                    "Session {} has no availability ID to release.",
                    sessionId
            );

            return;
        }


        if (sessionId == null) {

            throw new IllegalArgumentException(
                    "Session ID is required when releasing availability."
            );
        }


        int released =
                availabilityRepository
                        .releaseAvailabilityAtomically(
                                availabilityId,
                                sessionId
                        );


        if (released != 1) {

            throw new IllegalStateException(
                    "Could not release availability slot. "
                            + "The slot may already be released or "
                            + "may belong to another session."
            );
        }
    }
}