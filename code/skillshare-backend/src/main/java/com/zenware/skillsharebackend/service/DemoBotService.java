package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.entity.*;
import com.zenware.skillsharebackend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "demo.bot.enabled", havingValue = "true") // THE ON/OFF SWITCH
public class DemoBotService {

    private final SessionRepository sessionRepository;
    private final NotificationService notificationService;

    // This tells Spring to run this exact method every 15 seconds (15000 milliseconds)
    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void autoAcceptDemoSessions() {

        // 1. Find all PENDING sessions that belong to our fake Bot user
        List<Session> pendingSessions = sessionRepository.findByMentorEmailAndStatus(
                "bot@skillshare.com",
                SessionStatus.PENDING
        );

        // 2. Loop through them and automatically accept them
        for (Session session : pendingSessions) {

            // Change the status to ACCEPTED
            session.setStatus(SessionStatus.ACCEPTED);
            sessionRepository.save(session);

            // Fire the notification so the tester sees the little bell icon light up!
            notificationService.sendNotification(
                    session.getLearner(),
                    "Great news! Your session with Demo Mentor was automatically ACCEPTED. Your 10 credits are locked in Escrow.",
                    NotificationType.SESSION_UPDATE
            );

            // Just a little log for you so you know the bot is working in the background
            System.out.println("Bot automatically accepted session ID: " + session.getId());
        }
    }
}