package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.config.SessionProperties;
import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.AvailabilityRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionExpirationProcessorTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AvailabilityRepository availabilityRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private SessionProperties sessionProperties;

    @InjectMocks
    private SessionExpirationProcessor processor;

    private Session pendingSession;
    private Session acceptedSession;
    private User mockLearner;
    private User mockMentor;
    private UUID availabilityId;

    @BeforeEach
    void setUp() {
        lenient().when(sessionProperties.getPendingResponseTimeoutHours()).thenReturn(24);

        mockLearner = new User();
        mockLearner.setId(UUID.randomUUID());
        mockLearner.setFullName("Learner");

        mockMentor = new User();
        mockMentor.setId(UUID.randomUUID());
        mockMentor.setFullName("Mentor");

        availabilityId = UUID.randomUUID();

        pendingSession = new Session();
        pendingSession.setId(UUID.randomUUID());
        pendingSession.setLearner(mockLearner);
        pendingSession.setMentor(mockMentor);
        pendingSession.setStatus(SessionStatus.PENDING);
        pendingSession.setAvailabilityId(availabilityId);
        pendingSession.setCreatedAt(LocalDateTime.now().minusHours(25)); // older than 24h

        acceptedSession = new Session();
        acceptedSession.setId(UUID.randomUUID());
        acceptedSession.setLearner(mockLearner);
        acceptedSession.setMentor(mockMentor);
        acceptedSession.setStatus(SessionStatus.ACCEPTED);
        acceptedSession.setEndTime(LocalDateTime.now().minusMinutes(10)); // End time passed
    }

    @Test
    void processPendingExpiration_Success() {
        when(sessionRepository.findById(pendingSession.getId())).thenReturn(Optional.of(pendingSession));
        when(sessionRepository.transitionSessionStatusAtomically(pendingSession.getId(), SessionStatus.EXPIRED, List.of(SessionStatus.PENDING)))
                .thenReturn(1);
        when(availabilityRepository.releaseAvailabilityAtomically(availabilityId, pendingSession.getId()))
                .thenReturn(1);

        boolean result = processor.processPendingExpiration(pendingSession.getId());

        assertTrue(result);
        verify(userRepository).addCreditsAtomically(mockLearner.getId(), 10);
        verify(notificationService).sendNotification(eq(mockLearner), anyString(), eq(NotificationType.SYSTEM_ALERT));
    }

    @Test
    void processPendingExpiration_AvailabilityReleaseFails_ThrowsException() {
        when(sessionRepository.findById(pendingSession.getId())).thenReturn(Optional.of(pendingSession));
        when(sessionRepository.transitionSessionStatusAtomically(pendingSession.getId(), SessionStatus.EXPIRED, List.of(SessionStatus.PENDING)))
                .thenReturn(1);
        when(availabilityRepository.releaseAvailabilityAtomically(availabilityId, pendingSession.getId()))
                .thenReturn(0);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> processor.processPendingExpiration(pendingSession.getId()));
        assertTrue(ex.getMessage().contains("Failed to release availability"));
    }

    @Test
    void processAcceptedCompletion_Success() {
        when(sessionRepository.findById(acceptedSession.getId())).thenReturn(Optional.of(acceptedSession));
        when(sessionRepository.transitionSessionStatusAtomically(acceptedSession.getId(), SessionStatus.COMPLETED, List.of(SessionStatus.ACCEPTED)))
                .thenReturn(1);

        boolean result = processor.processAcceptedCompletion(acceptedSession.getId());

        assertTrue(result);
        verify(userRepository).addCreditsAtomically(mockMentor.getId(), 10);
        verify(notificationService).sendNotification(eq(mockMentor), anyString(), eq(NotificationType.SYSTEM_ALERT));
    }

    @Test
    void processAcceptedCompletion_NotExpiredYet_ReturnsFalse() {
        acceptedSession.setEndTime(LocalDateTime.now().plusMinutes(10)); // Not expired yet
        when(sessionRepository.findById(acceptedSession.getId())).thenReturn(Optional.of(acceptedSession));

        boolean result = processor.processAcceptedCompletion(acceptedSession.getId());

        assertFalse(result);
        verify(sessionRepository, never()).transitionSessionStatusAtomically(any(), any(), any());
    }

    @Test
    void processPendingExpiration_RecentSession_ReturnsFalse() {
        pendingSession.setCreatedAt(LocalDateTime.now().minusHours(23)); // Less than 24h
        when(sessionRepository.findById(pendingSession.getId())).thenReturn(Optional.of(pendingSession));

        boolean result = processor.processPendingExpiration(pendingSession.getId());

        assertFalse(result);
        verify(sessionRepository, never()).transitionSessionStatusAtomically(any(), any(), any());
    }

    @Test
    void processPendingExpiration_StartTimeReached_ReturnsTrue() {
        pendingSession.setCreatedAt(LocalDateTime.now().minusHours(2)); // Very recent
        pendingSession.setStartTime(LocalDateTime.now().minusMinutes(5)); // But start time has passed

        when(sessionRepository.findById(pendingSession.getId())).thenReturn(Optional.of(pendingSession));
        when(sessionRepository.transitionSessionStatusAtomically(pendingSession.getId(), SessionStatus.EXPIRED, List.of(SessionStatus.PENDING)))
                .thenReturn(1);
        when(availabilityRepository.releaseAvailabilityAtomically(availabilityId, pendingSession.getId()))
                .thenReturn(1);

        boolean result = processor.processPendingExpiration(pendingSession.getId());

        assertTrue(result);
        verify(userRepository).addCreditsAtomically(mockLearner.getId(), 10);
    }

    @Test
    void processPendingExpiration_NullCreatedAt_ReturnsFalse() {
        pendingSession.setCreatedAt(null);
        pendingSession.setStartTime(null);
        when(sessionRepository.findById(pendingSession.getId())).thenReturn(Optional.of(pendingSession));

        boolean result = processor.processPendingExpiration(pendingSession.getId());

        assertFalse(result);
        verify(sessionRepository, never()).transitionSessionStatusAtomically(any(), any(), any());
    }

    @Test
    void processPendingExpiration_AtomicTransitionFails_ReturnsFalse() {
        when(sessionRepository.findById(pendingSession.getId())).thenReturn(Optional.of(pendingSession));
        when(sessionRepository.transitionSessionStatusAtomically(pendingSession.getId(), SessionStatus.EXPIRED, List.of(SessionStatus.PENDING)))
                .thenReturn(0);

        boolean result = processor.processPendingExpiration(pendingSession.getId());

        assertFalse(result);
        verify(userRepository, never()).addCreditsAtomically(any(), anyInt());
        verify(availabilityRepository, never()).releaseAvailabilityAtomically(any(), any());
    }

    @Test
    void processPendingExpiration_WrongStatus_ReturnsFalse() {
        pendingSession.setStatus(SessionStatus.ACCEPTED); // Changed to wrong status
        when(sessionRepository.findById(pendingSession.getId())).thenReturn(Optional.of(pendingSession));

        boolean result = processor.processPendingExpiration(pendingSession.getId());

        assertFalse(result);
        verify(sessionRepository, never()).transitionSessionStatusAtomically(any(), any(), any());
    }

    @Test
    void processAcceptedCompletion_AtomicTransitionFails_ReturnsFalse() {
        when(sessionRepository.findById(acceptedSession.getId())).thenReturn(Optional.of(acceptedSession));
        when(sessionRepository.transitionSessionStatusAtomically(acceptedSession.getId(), SessionStatus.COMPLETED, List.of(SessionStatus.ACCEPTED)))
                .thenReturn(0);

        boolean result = processor.processAcceptedCompletion(acceptedSession.getId());

        assertFalse(result);
        verify(userRepository, never()).addCreditsAtomically(any(), anyInt());
    }

    @Test
    void processAcceptedCompletion_WrongStatus_ReturnsFalse() {
        acceptedSession.setStatus(SessionStatus.PENDING); // Changed to wrong status
        when(sessionRepository.findById(acceptedSession.getId())).thenReturn(Optional.of(acceptedSession));

        boolean result = processor.processAcceptedCompletion(acceptedSession.getId());

        assertFalse(result);
        verify(sessionRepository, never()).transitionSessionStatusAtomically(any(), any(), any());
    }
}
