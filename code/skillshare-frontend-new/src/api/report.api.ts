import { apiFetch } from "./client";
import { ReportReason } from "./types";

export interface ReportResponseDto {
    id: string;
    reporterId: string;
    reporterName: string;
    reportedUserId: string;
    reportedUserName: string;
    reportedUserEmail: string;
    sessionId?: string;
    reason: ReportReason;
    description: string;
    status: "PENDING" | "RESOLVED" | "DISMISSED";
    createdAt: string;
}

export const reportApi = {
    // Submit a report (POST /api/reports)
    submitReport: (data: {
        reportedUserId: string;
        sessionId?: string;
        reason: ReportReason;
        description: string;
    }) =>
        apiFetch<void>("/reports", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // Fetch all reports for admins (GET /api/reports/admin/all)
    getAllReports: () => apiFetch<ReportResponseDto[]>("/reports/admin/all"),

    // Update report status (PATCH /api/reports/admin/{reportId}/status?status=RESOLVED)
    updateStatus: (reportId: string, status: "RESOLVED" | "DISMISSED") =>
        apiFetch<void>(`/reports/admin/${reportId}/status?status=${status}`, {
            method: "PATCH",
        }),
};