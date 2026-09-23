// File: src/api/report.api.ts

import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type {
    ReportDto,
    ReportRequestDto,
    ReportStatus,
    ResolveReportPayload
} from "./types";

export const reportApi = {
    // User Actions
    submitReport: (payload: ReportRequestDto) =>
        apiFetch<string>(API_ROUTES.REPORTS, {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    // Admin Actions
    getReportsByStatus: (status?: ReportStatus) =>
        apiFetch<ReportDto[]>(
            `${API_ROUTES.ADMIN_REPORTS}${status ? `?status=${encodeURIComponent(status)}` : ""}`
        ),

    resolveReport: (reportId: string | number, payload: ResolveReportPayload) =>
        apiFetch<string>(API_ROUTES.adminReportResolve(reportId), {
            method: "PUT",
            body: JSON.stringify(payload),
        }),
};