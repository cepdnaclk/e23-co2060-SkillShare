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

import java.time.LocalDateTime;
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
        
        Session mockSavedSession = new Session();
        mockSavedSession.setId(UUID.randomUUID());
        mockSavedSession.setLearner(mockLearner);
        mockSavedSession.setMentor(mockMentor);
        mockSavedSession.setSkill(mockSkill);
        mockSavedSession.setStatus(SessionStatus.PENDING);
        
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSavedSession);

        // Act
        SessionResponse response = sessionService.bookSession(request);

        // Assert
        assertNotNull(response);
        assertEquals(SessionStatus.PENDING, response.getStatus());
        verify(userRepository).addCreditsAtomically(mockLearner.getId(), -10);
        assertTrue(mockAvailability.getIsBooked());
        verify(notificationService).sendNotification(eq(mockMentor), anyString(), any());
    }

    @Test
    void testBookSession_InsufficientCredits() {
        // Arrange
        mockLearner.setCredits(5);
        SessionRequest request = new SessionRequest();
        request.setSkillId(mockSkill.getId());
        request.setAvailabilityId(mockAvailability.getId());

        when(SecurityContextHolder.getContext().getAuthentication().getName()).thenReturn("learner@test.com");
        when(userRepository.findByEmail("learner@test.com")).thenReturn(Optional.of(mockLearner));
        when(skillRepository.findById(mockSkill.getId())).thenReturn(Optional.of(mockSkill));
        when(availabilityRepository.findById(mockAvailability.getId())).thenReturn(Optional.of(mockAvailability));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            sessionService.bookSession(request);
        });
        assertTrue(exception.getMessage().contains("not have enough credits"));
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
}
