package com.zenware.skillsharebackend.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class SessionExpirationSchedulerContextTest {

    @SpringBootTest
    @ActiveProfiles("test")
    @TestPropertySource(properties = "app.session.expiration.enabled=true")
    static class EnabledTest {
        @Autowired
        private ApplicationContext context;

        @Test
        void contextLoads_SchedulerIsPresent() {
            SessionExpirationScheduler scheduler = context.getBean(SessionExpirationScheduler.class);
            assertNotNull(scheduler);
        }
    }

    @SpringBootTest
    @ActiveProfiles("test")
    @TestPropertySource(properties = "app.session.expiration.enabled=false")
    static class DisabledTest {
        @Autowired
        private ApplicationContext context;

        @Test
        void contextLoads_SchedulerIsMissing() {
            assertThrows(NoSuchBeanDefinitionException.class, () -> {
                context.getBean(SessionExpirationScheduler.class);
            });
        }
    }
}
