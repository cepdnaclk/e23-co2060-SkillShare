package com.zenware.skillsharebackend.controller;

import com.zenware.skillsharebackend.dto.DashboardResponse;
import com.zenware.skillsharebackend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // GET: /api/dashboard/me
    @GetMapping("/me")
    public ResponseEntity<DashboardResponse> getMyDashboard() {
        return ResponseEntity.ok(dashboardService.getMyDashboardStats());
    }
}