package com.zenware.skillsharebackend;

import com.zenware.skillsharebackend.dto.SessionRequest;
import com.zenware.skillsharebackend.dto.SessionResponse;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.SkillRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.service.GamificationService;
import com.zenware.skillsharebackend.service.NotificationService;
import com.zenware.skillsharebackend.service.SessionExpirationProcessor;
import com.zenware.skillsharebackend.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SkillRepository skillRepository;
    @Mock
    private AvailabilityRepository availabilityRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private GamificationService gamificationService;
    @Mock
    private SessionExpirationProcessor sessionExpirationProcessor;

    @InjectMocks
    private SessionService sessionService;

    private User mockLearner;
    private User mockMentor;
    private Skill mockSkill;
    private Availability mockAvailability;

    @BeforeEach
    void setUp() {
        mockLearner = new User();
        mockLearner.setId(UUID.randomUUID());
        mockLearner.setEmail("learner@test.com");
        mockLearner.setCredits(50);
        mockLearner.setFullName("Test Learner");

        mockMentor = new User();
        mockMentor.setId(UUID.randomUUID());
        mockMentor.setEmail("mentor@test.com");
        mockMentor.setCredits(100);
        mockMentor.setFullName("Test Mentor");

        mockSkill = new Skill();
        mockSkill.setId(UUID.randomUUID());
        mockSkill.setName("Java");

        mockAvailability = new Availability();
        mockAvailability.setId(UUID.randomUUID());
        mockAvailability.setUser(mockMentor);
        mockAvailability.setIsBooked(false);
        mockAvailability.setStartTime(LocalDateTime.now().plusDays(1));
        mockAvailability.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        lenient().when(userRepository.findById(mockMentor.getId())).thenReturn(Optional.of(mockMentor));

        ReflectionTestUtils.setField(sessionService, "responseTimeoutHours", 24);
    }

    @Test
    void testBookSession_Success() {
        // Arrange
        SessionRequest request = new SessionRequest();
        request.setSkillId(mockSkill.getId());
        request.setAvailabilityId(mockAvailability.getId());

        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("learner@test.com");
        when(userRepository.findByEmail("learner@test.com")).thenReturn(Optional.of(mockLearner));
        when(skillRepository.findById(mockSkill.getId())).thenReturn(Optional.of(mockSkill));
        when(availabilityRepository.findById(mockAvailability.getId())).thenReturn(Optional.of(mockAvailability));
        when(userRepository.deductCreditsIfSufficient(mockLearner.getId(), 10)).thenReturn(1);
        Session mockSavedSession = new Session();
        mockSavedSession.setId(UUID.randomUUID());
        mockSavedSession.setLearner(mockLearner);
        mockSavedSession.setMentor(mockMentor);
        mockSavedSession.setSkill(mockSkill);
        mockSavedSession.setStatus(SessionStatus.PENDING);

        when(availabilityRepository.reserveAvailabilityAtomically(eq(mockAvailability.getId()), eq(mockSavedSession.getId()))).thenReturn(1);

        when(sessionRepository.save(any(Session.class))).thenReturn(mockSavedSession);

        // Act
        SessionResponse response = sessionService.bookSession(request);

        // Assert
        assertNotNull(response);
        assertEquals(SessionStatus.PENDING, response.getStatus());
        verify(userRepository).deductCreditsIfSufficient(mockLearner.getId(), 10);
        verify(notificationService).sendNotification(eq(mockMentor), anyString(), any());
    }

    @Test
    void testBookSession_InsufficientCredits() {
        // Arrange
        SessionRequest request = new SessionRequest();
        request.setSkillId(mockSkill.getId());
        request.setAvailabilityId(mockAvailability.getId());

        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("learner@test.com");
        when(userRepository.findByEmail("learner@test.com")).thenReturn(Optional.of(mockLearner));
        when(skillRepository.findById(mockSkill.getId())).thenReturn(Optional.of(mockSkill));
        when(availabilityRepository.findById(mockAvailability.getId())).thenReturn(Optional.of(mockAvailability));

        when(userRepository.deductCreditsIfSufficient(mockLearner.getId(), 10)).thenReturn(0);

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.bookSession(request);
        });
        assertTrue(exception.getMessage().contains("not have enough credits"));
        verify(sessionRepository, never()).save(any(Session.class));
    }

    @Test
    void testBookSession_ReservationFailure() {
        // Arrange
        SessionRequest request = new SessionRequest();
        request.setSkillId(mockSkill.getId());
        request.setAvailabilityId(mockAvailability.getId());

        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("learner@test.com");
        when(userRepository.findByEmail("learner@test.com")).thenReturn(Optional.of(mockLearner));
        when(skillRepository.findById(mockSkill.getId())).thenReturn(Optional.of(mockSkill));
        when(availabilityRepository.findById(mockAvailability.getId())).thenReturn(Optional.of(mockAvailability));
        when(userRepository.deductCreditsIfSufficient(mockLearner.getId(), 10)).thenReturn(1);

        Session mockSavedSession = new Session();
        mockSavedSession.setId(UUID.randomUUID());
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSavedSession);

        when(availabilityRepository.reserveAvailabilityAtomically(eq(mockAvailability.getId()), eq(mockSavedSession.getId()))).thenReturn(0);

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.bookSession(request);
        });
        assertEquals("Sorry, this time slot is already booked!", exception.getMessage());
        verify(sessionRepository).save(any(Session.class));
    }

    @Test
    void testCompleteSession_BeforeEndTime() {
        // Arrange
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setStatus(SessionStatus.ACCEPTED);
        session.setEndTime(LocalDateTime.now().plusHours(1)); // Future end time

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.completeSession(session.getId());
        });
        assertEquals("Cannot complete session before its end time.", exception.getMessage());
    }

    @Test
    void testUpdateSessionStatus_Accepted_Success() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.PENDING);
        session.setStartTime(LocalDateTime.now().plusHours(1));

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("mentor@test.com");
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(mockMentor));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.ACCEPTED,
                List.of(SessionStatus.PENDING)
        )).thenReturn(1);

        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        SessionResponse response = sessionService.updateSessionStatus(session.getId(), SessionStatus.ACCEPTED);

        assertEquals(SessionStatus.ACCEPTED, response.getStatus());
        verify(notificationService).sendNotification(eq(mockLearner), anyString(), any());
    }

    @Test
    void testUpdateSessionStatus_Rejected_Success() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.PENDING);
        session.setAvailabilityId(mockAvailability.getId());

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("mentor@test.com");
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(mockMentor));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.REJECTED,
                List.of(SessionStatus.PENDING)
        )).thenReturn(1);

        when(sessionRepository.save(any(Session.class))).thenReturn(session);
        when(availabilityRepository.releaseAvailabilityAtomically(mockAvailability.getId(), session.getId())).thenReturn(1);

        SessionResponse response = sessionService.updateSessionStatus(session.getId(), SessionStatus.REJECTED);

        assertEquals(SessionStatus.REJECTED, response.getStatus());
        verify(userRepository).addCreditsAtomically(mockLearner.getId(), 10);
        verify(availabilityRepository).releaseAvailabilityAtomically(eq(mockAvailability.getId()), eq(session.getId()));
    }

    @Test
    void testUpdateSessionStatus_AlreadyProcessed() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setStatus(SessionStatus.PENDING);
        session.setStartTime(LocalDateTime.now().plusHours(1));

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("mentor@test.com");
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(mockMentor));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.ACCEPTED,
                List.of(SessionStatus.PENDING)
        )).thenReturn(0);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.updateSessionStatus(session.getId(), SessionStatus.ACCEPTED);
        });
        assertTrue(exception.getMessage().contains("was already processed"));
    }

    @Test
    void testCancelSession_LearnerCancelsPending() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.PENDING);
        session.setAvailabilityId(mockAvailability.getId());

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.CANCELLED,
                List.of(SessionStatus.PENDING)
        )).thenReturn(1);

        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("learner@test.com");
        when(userRepository.findByEmail("learner@test.com")).thenReturn(Optional.of(mockLearner));

        when(sessionRepository.save(any(Session.class))).thenReturn(session);
        when(availabilityRepository.releaseAvailabilityAtomically(mockAvailability.getId(), session.getId())).thenReturn(1);

        SessionResponse response = sessionService.cancelSession(session.getId());

        assertEquals(SessionStatus.CANCELLED, response.getStatus());
        verify(userRepository).addCreditsAtomically(mockLearner.getId(), 10);
        verify(availabilityRepository).releaseAvailabilityAtomically(eq(mockAvailability.getId()), eq(session.getId()));
    }

    @Test
    void testCancelSession_LearnerCancelsAccepted_Penalty() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.ACCEPTED);
        session.setStartTime(LocalDateTime.now().plusHours(1));
        session.setAvailabilityId(mockAvailability.getId());

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.CANCELLED,
                List.of(SessionStatus.ACCEPTED)
        )).thenReturn(1);

        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("learner@test.com");
        when(userRepository.findByEmail("learner@test.com")).thenReturn(Optional.of(mockLearner));

        when(sessionRepository.save(any(Session.class))).thenReturn(session);
        when(availabilityRepository.releaseAvailabilityAtomically(mockAvailability.getId(), session.getId())).thenReturn(1);

        SessionResponse response = sessionService.cancelSession(session.getId());

        assertEquals(SessionStatus.CANCELLED, response.getStatus());
        verify(userRepository).addCreditsAtomically(mockLearner.getId(), 5);
        verify(userRepository).addCreditsAtomically(mockMentor.getId(), 5);
        verify(availabilityRepository).releaseAvailabilityAtomically(eq(mockAvailability.getId()), eq(session.getId()));
    }

    @Test
    void testCancelSession_MentorCancelsPending() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.PENDING);
        session.setAvailabilityId(mockAvailability.getId());

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.CANCELLED,
                List.of(SessionStatus.PENDING)
        )).thenReturn(1);

        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("mentor@test.com");
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(mockMentor));

        when(sessionRepository.save(any(Session.class))).thenReturn(session);
        when(availabilityRepository.releaseAvailabilityAtomically(mockAvailability.getId(), session.getId())).thenReturn(1);

        SessionResponse response = sessionService.cancelSession(session.getId());

        assertEquals(SessionStatus.CANCELLED, response.getStatus());
        verify(userRepository).addCreditsAtomically(mockLearner.getId(), 10);
        verify(availabilityRepository).releaseAvailabilityAtomically(eq(mockAvailability.getId()), eq(session.getId()));
    }

    @Test
    void testCancelSession_MentorCancelsAccepted_Penalty() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.ACCEPTED);
        session.setStartTime(LocalDateTime.now().plusHours(1));
        session.setAvailabilityId(mockAvailability.getId());

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.CANCELLED,
                List.of(SessionStatus.ACCEPTED)
        )).thenReturn(1);

        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("mentor@test.com");
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(mockMentor));

        when(sessionRepository.save(any(Session.class))).thenReturn(session);
        when(availabilityRepository.releaseAvailabilityAtomically(mockAvailability.getId(), session.getId())).thenReturn(1);

        SessionResponse response = sessionService.cancelSession(session.getId());

        assertEquals(SessionStatus.CANCELLED, response.getStatus());
        verify(userRepository).addCreditsAtomically(mockLearner.getId(), 15);
        verify(userRepository).addCreditsAtomically(mockMentor.getId(), -5);
        verify(availabilityRepository).releaseAvailabilityAtomically(eq(mockAvailability.getId()), eq(session.getId()));
    }

    @Test
    void testCancelSession_LearnerCancelsAccepted_AfterStartTime() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setStatus(SessionStatus.ACCEPTED);
        session.setStartTime(LocalDateTime.now().minusHours(1));

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.cancelSession(session.getId());
        });
        assertTrue(exception.getMessage().contains("Cannot cancel an ACCEPTED session after its scheduled start time"));

        verify(sessionRepository, never()).transitionSessionStatusAtomically(any(UUID.class), any(SessionStatus.class), anyList());
        verify(userRepository, never()).addCreditsAtomically(any(UUID.class), anyInt());
        verify(availabilityRepository, never()).releaseAvailabilityAtomically(any(UUID.class), any(UUID.class));
    }

    @Test
    void testCancelSession_MentorCancelsAccepted_AfterStartTime() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setStatus(SessionStatus.ACCEPTED);
        session.setStartTime(LocalDateTime.now().minusHours(1));

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.cancelSession(session.getId());
        });
        assertTrue(exception.getMessage().contains("Cannot cancel an ACCEPTED session after its scheduled start time"));
    }

    @Test
    void testCancelSession_Accepted_NullStartTime() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setStatus(SessionStatus.ACCEPTED);
        session.setStartTime(null);

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.cancelSession(session.getId());
        });
        assertTrue(exception.getMessage().contains("Cannot cancel an ACCEPTED session after its scheduled start time"));
    }

    @Test
    void testCancelSession_Accepted_ExactlyAtStartTime() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setStatus(SessionStatus.ACCEPTED);
        session.setStartTime(LocalDateTime.now()); // Exactly now is NOT before now

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.cancelSession(session.getId());
        });
        assertTrue(exception.getMessage().contains("Cannot cancel an ACCEPTED session after its scheduled start time"));
    }

    @Test
    void testCancelSession_AlreadyProcessed() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setStatus(SessionStatus.PENDING);

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.CANCELLED,
                List.of(SessionStatus.PENDING)
        )).thenReturn(0);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.cancelSession(session.getId());
        });
        assertTrue(exception.getMessage().contains("already cancelled or processed"));
    }

    @Test
    void testCompleteSession_Success() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.ACCEPTED);
        session.setEndTime(LocalDateTime.now().minusHours(1));

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("learner@test.com");
        when(userRepository.findByEmail("learner@test.com")).thenReturn(Optional.of(mockLearner));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.COMPLETED,
                List.of(SessionStatus.ACCEPTED)
        )).thenReturn(1);

        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        SessionResponse response = sessionService.completeSession(session.getId());

        assertEquals(SessionStatus.COMPLETED, response.getStatus());
        verify(gamificationService).awardSessionCompletionXp(mockLearner);
        verify(gamificationService).awardSessionCompletionXp(mockMentor);
        verify(userRepository).addCreditsAtomically(mockMentor.getId(), 10);
    }

    @Test
    void testCompleteSession_AlreadyProcessed() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setStatus(SessionStatus.ACCEPTED);
        session.setEndTime(LocalDateTime.now().minusHours(1));

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("learner@test.com");
        when(userRepository.findByEmail("learner@test.com")).thenReturn(Optional.of(mockLearner));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(),
                SessionStatus.COMPLETED,
                List.of(SessionStatus.ACCEPTED)
        )).thenReturn(0);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.completeSession(session.getId());
        });
        assertTrue(exception.getMessage().contains("already completed"));
    }

    @Test
    void testExpire_CoordinatesWithProcessorAndCountsSuccessfully() {
        Session pendingSession1 = new Session();
        pendingSession1.setId(UUID.randomUUID());

        Session pendingSession2 = new Session();
        pendingSession2.setId(UUID.randomUUID());

        Session pendingSession3 = new Session(); // ineligible
        pendingSession3.setId(UUID.randomUUID());

        Session acceptedSession = new Session();
        acceptedSession.setId(UUID.randomUUID());

        when(sessionRepository.findPendingSessionsForExpiration(eq(SessionStatus.PENDING), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(pendingSession1, pendingSession2, pendingSession3)); // Three pending

        when(sessionRepository.findByStatusInAndEndTimeBefore(eq(List.of(SessionStatus.ACCEPTED)), any(LocalDateTime.class)))
                .thenReturn(List.of(acceptedSession)); // One accepted

        // Processor succeeds for first pending, fails (exception) for second, returns false (ineligible) for third
        when(sessionExpirationProcessor.processPendingExpiration(pendingSession1.getId()))
                .thenReturn(true);
        when(sessionExpirationProcessor.processPendingExpiration(pendingSession2.getId()))
                .thenThrow(new RuntimeException("Simulated poison pill failure"));
        when(sessionExpirationProcessor.processPendingExpiration(pendingSession3.getId()))
                .thenReturn(false);

        // Processor succeeds for accepted
        when(sessionExpirationProcessor.processAcceptedCompletion(acceptedSession.getId()))
                .thenReturn(true);

        int processedCount = sessionService.expireOverdueSessions();

        // 1 pending succeeded + 1 accepted succeeded = 2
        assertEquals(2, processedCount);

        verify(sessionExpirationProcessor, times(1)).processPendingExpiration(pendingSession1.getId());
        verify(sessionExpirationProcessor, times(1)).processPendingExpiration(pendingSession2.getId());
        verify(sessionExpirationProcessor, times(1)).processPendingExpiration(pendingSession3.getId());
        verify(sessionExpirationProcessor, times(1)).processAcceptedCompletion(acceptedSession.getId());
    }

    @Test
    void testAcceptance_BeforeDeadlineSucceeds() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.PENDING);
        session.setStartTime(LocalDateTime.now().plusHours(5));
        session.setCreatedAt(LocalDateTime.now().minusHours(10)); // Created 10h ago (< 24)

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("mentor@test.com");
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(mockMentor));

        when(sessionRepository.transitionSessionStatusAtomically(
                session.getId(), SessionStatus.ACCEPTED, List.of(SessionStatus.PENDING)
        )).thenReturn(1);

        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        SessionResponse response = sessionService.updateSessionStatus(session.getId(), SessionStatus.ACCEPTED);
        assertEquals(SessionStatus.ACCEPTED, response.getStatus());
    }

    @Test
    void testAcceptance_AfterResponseDeadlineFails() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.PENDING);
        session.setStartTime(LocalDateTime.now().plusHours(5));
        session.setCreatedAt(LocalDateTime.now().minusHours(25)); // Created 25h ago (> 24)

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("mentor@test.com");
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(mockMentor));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.updateSessionStatus(session.getId(), SessionStatus.ACCEPTED);
        });
        assertEquals("Session request has expired and cannot be accepted.", exception.getMessage());
        verify(sessionRepository, never()).transitionSessionStatusAtomically(any(), any(), any());
    }

    @Test
    void testAcceptance_AfterStartTimeFails() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.PENDING);
        session.setStartTime(LocalDateTime.now().minusHours(1)); // Start time 1h ago
        session.setCreatedAt(LocalDateTime.now().minusHours(5));

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("mentor@test.com");
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(mockMentor));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.updateSessionStatus(session.getId(), SessionStatus.ACCEPTED);
        });
        assertEquals("Session request has expired and cannot be accepted.", exception.getMessage());
    }

    @Test
    void testExpiration_ExactBoundaryBehavior() {
        Session session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(mockLearner);
        session.setMentor(mockMentor);
        session.setSkill(mockSkill);
        session.setStatus(SessionStatus.PENDING);
        // We set createdAt exactly to 24 hours ago
        session.setCreatedAt(LocalDateTime.now().minusHours(24));
        session.setStartTime(LocalDateTime.now().plusHours(1)); // Start time in future

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("mentor@test.com");
        when(userRepository.findByEmail("mentor@test.com")).thenReturn(Optional.of(mockMentor));

        // It should fail since the condition is !timeoutThreshold.isBefore(session.getCreatedAt())
        // which means if createdAt <= timeoutThreshold, it fails.
        // minusHours(24) is <= minusHours(24) so it fails.
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.updateSessionStatus(session.getId(), SessionStatus.ACCEPTED);
        });
        assertEquals("Session request has expired and cannot be accepted.", exception.getMessage());
    }

}
