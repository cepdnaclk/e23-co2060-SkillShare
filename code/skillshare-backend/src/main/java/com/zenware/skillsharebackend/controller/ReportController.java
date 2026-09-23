package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.ReportRequestDto;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
}