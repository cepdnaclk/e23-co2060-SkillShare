package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.ReportRequestDto;
import com.zenware.skillsharebackend.entity.Report;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.repository.ReportRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;

    @Transactional
    public void createReport(UUID reporterId, ReportRequestDto dto) {
        if (reporterId.equals(dto.getReportedUserId())) {
            throw new IllegalArgumentException("You cannot report yourself.");
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalArgumentException("Reporter user not found"));

        User reportedUser = userRepository.findById(dto.getReportedUserId())
                .orElseThrow(() -> new IllegalArgumentException("Reported user not found"));

        Report report = new Report();
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setReason(dto.getReason());
        report.setDescription(dto.getDescription());

        if (dto.getSessionId() != null) {
            Session session = sessionRepository.findById(dto.getSessionId()).orElse(null);
            report.setSession(session);
        }

        reportRepository.save(report);
    }
}