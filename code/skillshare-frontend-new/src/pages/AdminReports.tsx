import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flag, ExternalLink, CheckCircle2, XCircle, ShieldAlert, Clock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { reportApi, type ReportResponseDto } from "@/api/report.api";
import { toast } from "sonner";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const AdminReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<ReportResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "RESOLVED" | "DISMISSED">("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await reportApi.getAllReports();
            setReports(data);
        } catch (err: unknown) {
            setError((err as Error).message ?? "Failed to load reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleStatusChange = async (reportId: string, status: "RESOLVED" | "DISMISSED") => {
        setUpdatingId(reportId);
        try {
            await reportApi.updateStatus(reportId, status);
            toast.success(`Report marked as ${status.toLowerCase()}.`);
            setReports((prev) =>
                prev.map((r) => (r.id === reportId ? { ...r, status } : r))
            );
        } catch (err: unknown) {
            toast.error((err as Error).message ?? "Failed to update report status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredReports = reports.filter((r) =>
        statusFilter === "ALL" ? true : r.status === statusFilter
    );

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-destructive" /> Reports Management
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Review platform reports, inspect reported user profiles, and moderate issues.
                        </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-secondary/60 p-1 rounded-lg border border-border/50">
                        {(["PENDING", "RESOLVED", "DISMISSED", "ALL"] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    statusFilter === filter
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

                {/* Content Section */}
                {loading ? (
                    <SkeletonList count={4} />
                ) : filteredReports.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-border rounded-xl">
                        <Flag className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground text-sm">No {statusFilter.toLowerCase()} reports found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReports.map((report) => (
                            <div
                                key={report.id}
                                className="p-5 border border-border/70 rounded-xl bg-card hover:border-border transition-colors space-y-4"
                            >
                                {/* Top Meta Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={report.status === "PENDING" ? "destructive" : "secondary"}>
                                            {report.reason.replace(/_/g, " ")}
                                        </Badge>
                                        {report.sessionId && (
                                            <Badge variant="outline" className="text-[10px] font-mono">
                                                Session Linked
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {formatDate(report.createdAt)}
                  </span>
                                </div>

                                {/* Details Grid */}
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    {/* Reported User Box */}
                                    <div className="p-3 bg-secondary/30 rounded-lg border border-border/40 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Reported User
                    </span>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground truncate">{report.reportedUserName}</p>
                                                <p className="text-xs text-muted-foreground truncate">{report.reportedUserEmail}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 gap-1.5 text-xs shrink-0"
                                                onClick={() => navigate(`/profile/${report.reportedUserId}`)}
                                            >
                                                View Profile <ExternalLink className="w-3.5 h-3.5" />
                                            </Button>


                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 gap-1.5 text-xs shrink-0 border-destructive/30 hover:bg-destructive/10 text-destructive"
                                                onClick={() => navigate(`/admin?highlight=${report.reportedUserId}`)}
                                            >
                                                <ShieldAlert className="w-3.5 h-3.5" /> Moderate User
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Reporter User Box */}
                                    <div className="p-3 bg-secondary/30 rounded-lg border border-border/40 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Submitted By
                    </span>
                                        <p className="font-medium text-foreground">{report.reporterName}</p>
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                            ID: {report.reporterId}
                                        </p>
                                    </div>
                                </div>

                                {/* Evidence / Reason Description */}
                                <div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block mb-1">
                    Details & Evidence
                  </span>
                                    <p className="text-sm text-foreground bg-background p-3 rounded-lg border border-border/50 leading-relaxed whitespace-pre-wrap">
                                        {report.description}
                                    </p>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    Status: <strong className="text-foreground">{report.status}</strong>
                  </span>

                                    {report.status === "PENDING" && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 gap-1.5 text-xs"
                                                disabled={updatingId === report.id}
                                                onClick={() => handleStatusChange(report.id, "DISMISSED")}
                                            >
                                                <XCircle className="w-3.5 h-3.5 text-muted-foreground" /> Dismiss
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                disabled={updatingId === report.id}
                                                onClick={() => handleStatusChange(report.id, "RESOLVED")}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default AdminReports;