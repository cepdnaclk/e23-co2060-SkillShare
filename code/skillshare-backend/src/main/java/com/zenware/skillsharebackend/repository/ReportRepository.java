package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    // Custom query method used by ReportService.getAllReports()
    List<Report> findAllByOrderByCreatedAtDesc();
}