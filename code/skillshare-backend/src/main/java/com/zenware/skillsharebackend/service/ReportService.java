package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.ReportRequestDto;
import com.zenware.skillsharebackend.dto.ReportResponseDto;
import com.zenware.skillsharebackend.entity.Report;
import com.zenware.skillsharebackend.entity.ReportStatus; // Ensure inner enum or standalone import matches
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.entity.Session;
import com.zenware.skillsharebackend.repository.ReportRepository;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors; // 👈 ADDED THIS IMPORT

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

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateReportStatus(UUID reportId, ReportStatus newStatus) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        report.setStatus(newStatus);
        reportRepository.save(report);
    }

    private ReportResponseDto mapToDto(Report report) {
        ReportResponseDto dto = new ReportResponseDto();
        dto.setId(report.getId());

        if (report.getReporter() != null) {
            dto.setReporterId(report.getReporter().getId());
            dto.setReporterName(report.getReporter().getFullName());
        }

        if (report.getReportedUser() != null) {
            dto.setReportedUserId(report.getReportedUser().getId());
            dto.setReportedUserName(report.getReportedUser().getFullName());
            dto.setReportedUserEmail(report.getReportedUser().getEmail());
        }

        if (report.getSession() != null) {
            dto.setSessionId(report.getSession().getId());
        }

        dto.setReason(report.getReason());
        dto.setDescription(report.getDescription());
        dto.setStatus(report.getStatus());
        dto.setCreatedAt(report.getCreatedAt());

        return dto;
    }
}