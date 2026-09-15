package com.zenware.skillsharebackend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SessionExpirationSchedulerTest {

    @Mock
    private SessionService sessionService;

    @InjectMocks
    private SessionExpirationScheduler scheduler;

    @Test
    void autoExpireSessions_InvokesService() {
        when(sessionService.expireOverdueSessions()).thenReturn(3);

        scheduler.autoExpireSessions();

        verify(sessionService, times(1)).expireOverdueSessions();
    }

    @Test
    void autoExpireSessions_CatchesException_DoesNotRethrow() {
        when(sessionService.expireOverdueSessions()).thenThrow(new RuntimeException("Database down"));

        // If it rethrows, the test will fail
        scheduler.autoExpireSessions();

        verify(sessionService, times(1)).expireOverdueSessions();
    }
}
