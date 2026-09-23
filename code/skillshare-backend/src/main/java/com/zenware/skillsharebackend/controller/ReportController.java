package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.ReportRequestDto;
import com.zenware.skillsharebackend.dto.ReportResponseDto;
import com.zenware.skillsharebackend.entity.ReportStatus;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor // LOGIC: Modern Constructor Injection!
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<String> submitReport(
            @AuthenticationPrincipal User currentUser,
            @RequestBody ReportRequestDto request) {

        // LOGIC: No try-catch! If it fails, GlobalExceptionHandler takes over.
        // SECURITY: The reporter is determined strictly by the Security Context (currentUser), not client input.
        reportService.createReport(currentUser.getId(), request);
        return ResponseEntity.ok("Report submitted successfully. Our team will review it shortly.");
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReportResponseDto>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @PatchMapping("/admin/{reportId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateStatus(
            @PathVariable UUID reportId,
            @RequestParam ReportStatus status) {
        reportService.updateReportStatus(reportId, status);
        return ResponseEntity.ok().build();
    }
}