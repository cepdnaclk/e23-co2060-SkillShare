package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.AvailabilityRequest;
import com.zenware.skillsharebackend.dto.AvailabilityResponse;
import com.zenware.skillsharebackend.entity.Availability;
import com.zenware.skillsharebackend.entity.ParticipantStatus;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.entity.SessionStatus;
import com.zenware.skillsharebackend.entity.SessionType;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.SessionParticipantRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final SessionParticipantRepository sessionParticipantRepository;
    private final Clock clock;

    // =========================================================
    // AUTHENTICATED USER
    // =========================================================

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()
                || "anonymousUser".equals(authentication.getName())) {

            throw new IllegalStateException("You must be authenticated to manage availability.");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found."));
    }

    // =========================================================
    // CURRENT TIME
    // =========================================================

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    // =========================================================
    // MAP ENTITY -> RESPONSE
    // =========================================================

    @Transactional(readOnly = true)
    public AvailabilityResponse mapToResponse(Availability availability) {
        if (availability == null) {
            throw new IllegalArgumentException("Availability cannot be null.");
        }

        UUID activeSessionId = availability.getActiveSessionId();
        String sessionType = null;
        String groupStatus = null;
        Integer groupCapacity = null;
        Integer groupJoinedCount = null;

        if (Boolean.TRUE.equals(availability.getIsBooked()) && activeSessionId != null) {
            Session session = sessionRepository.findById(activeSessionId).orElse(null);

            if (session != null) {
                if (session.getSessionType() != null) {
                    sessionType = session.getSessionType().name();
                }

                if (session.getSessionType() == SessionType.GROUP) {
                    if (session.getStatus() != null) {
                        groupStatus = session.getStatus().name();
                    }

                    groupCapacity = session.getCapacity();

                    groupJoinedCount = Math.toIntExact(
                            sessionParticipantRepository.countBySessionIdAndStatus(
                                    session.getId(),
                                    ParticipantStatus.JOINED
                            )
                    );
                }
            }
        }

        return AvailabilityResponse.builder()
                .id(availability.getId())
                .mentorId(availability.getUser() != null ? availability.getUser().getId() : null)
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .isBooked(Boolean.TRUE.equals(availability.getIsBooked()))
                .activeSessionId(activeSessionId)
                .sessionType(sessionType)
                .groupStatus(groupStatus)
                .groupCapacity(groupCapacity)
                .groupJoinedCount(groupJoinedCount)
                .build();
    }

    // =========================================================
    // ADD AVAILABILITY
    // =========================================================

    @Transactional
    public AvailabilityResponse addAvailability(AvailabilityRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Availability request cannot be null.");
        }

        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = request.getEndTime();

        if (startTime == null) {
            throw new IllegalArgumentException("Start time is required.");
        }

        if (endTime == null) {
            throw new IllegalArgumentException("End time is required.");
        }

        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        // Compare using system/clock zone safely with a 5-minute buffer for network/clock differences
        LocalDateTime currentTime = now().minusMinutes(5);

        if (startTime.isBefore(currentTime)) {
            throw new IllegalArgumentException("Availability must be in the future.");
        }

        if (endTime.isBefore(currentTime)) {
            throw new IllegalArgumentException("End time must be in the future.");
        }

        User currentUser = getCurrentUser();

        int overlapping = availabilityRepository.countOverlappingSlots(
                currentUser.getId(),
                startTime,
                endTime
        );

        if (overlapping > 0) {
            throw new IllegalStateException("You already have an availability slot overlapping this time.");
        }

        Availability availability = Availability.builder()
                .user(currentUser)
                .startTime(startTime)
                .endTime(endTime)
                .isBooked(false)
                .activeSessionId(null)
                .build();

        Availability saved = availabilityRepository.save(availability);

        return mapToResponse(saved);
    }

    // =========================================================
    // DELETE AVAILABILITY
    // =========================================================

    @Transactional
    public void deleteAvailability(UUID availabilityId) {
        if (availabilityId == null) {
            throw new IllegalArgumentException("Availability ID is required.");
        }

        User currentUser = getCurrentUser();

        Availability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new IllegalArgumentException("Availability slot not found."));

        if (availability.getUser() == null
                || availability.getUser().getId() == null
                || !availability.getUser().getId().equals(currentUser.getId())) {

            throw new IllegalStateException("You can only delete your own availability slots.");
        }

        if (Boolean.TRUE.equals(availability.getIsBooked())) {
            throw new IllegalStateException("This availability slot is currently being used by a session.");
        }

        availabilityRepository.delete(availability);
    }

    // =========================================================
    // MENTOR SLOTS VISIBLE TO OTHER USERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getMentorFreeSlots(UUID mentorId) {
        if (mentorId == null) {
            throw new IllegalArgumentException("Mentor ID is required.");
        }

        userRepository.findById(mentorId)
                .orElseThrow(() -> new IllegalArgumentException("Mentor not found."));

        LocalDateTime currentTime = now();

        List<Availability> slots = availabilityRepository.findByUserId(mentorId);

        return slots.stream()
                .filter(slot -> slot != null && slot.getStartTime() != null && slot.getEndTime() != null)
                .filter(slot -> slot.getStartTime().isBefore(slot.getEndTime()))
                .filter(slot -> slot.getStartTime().isAfter(currentTime))
                .filter(this::isVisibleToLearners)
                .sorted(Comparator.comparing(Availability::getStartTime))
                .map(this::mapToResponse)
                .toList();
    }

    // =========================================================
    // DETERMINE WHETHER A SLOT IS VISIBLE
    // =========================================================

    private boolean isVisibleToLearners(Availability availability) {
        if (!Boolean.TRUE.equals(availability.getIsBooked())) {
            return true;
        }

        if (availability.getActiveSessionId() == null) {
            return false;
        }

        Session session = sessionRepository.findById(availability.getActiveSessionId()).orElse(null);

        if (session == null) {
            return false;
        }

        if (session.getSessionType() == SessionType.INDIVIDUAL) {
            return false;
        }

        if (session.getSessionType() != SessionType.GROUP) {
            return false;
        }

        return session.getStatus() == SessionStatus.PENDING
                || session.getStatus() == SessionStatus.ACCEPTED;
    }

    // =========================================================
    // MY AVAILABILITY
    // =========================================================

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getMyAvailabilities() {
        User currentUser = getCurrentUser();

        return availabilityRepository.findByUserId(currentUser.getId())
                .stream()
                .filter(slot -> slot != null && slot.getStartTime() != null && slot.getEndTime() != null)
                .sorted(Comparator.comparing(Availability::getStartTime))
                .map(this::mapToResponse)
                .toList();
    }
}