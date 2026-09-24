import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Flag } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { reportApi } from "@/api/report.api";
import { ReportReason } from "@/api/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ReportUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportedUserId: string;
    reportedUserName?: string;
    sessionId?: string | null;
}

export const ReportUserModal = ({
                                    open,
                                    onOpenChange,
                                    reportedUserId,
                                    reportedUserName = "User",
                                    sessionId = null,
                                }: ReportUserModalProps) => {
    const [reason, setReason] = useState<ReportReason | "">("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setReason("");
            setDescription("");
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) {
            toast.error("Please select a reason for reporting.");
            return;
        }
        if (!description.trim()) {
            toast.error("Please provide a description for the report.");
            return;
        }

        setIsSubmitting(true);
        try {
            await reportApi.submitReport({
                reportedUserId,
                sessionId: sessionId || undefined,
                reason,
                description: description.trim(),
            });

            toast.success("Report submitted successfully. Our team will review it.");
            onOpenChange(false);
        } catch (err: any) {
            toast.error(
                err?.message || "Failed to submit report. Please try again later."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden gap-0 bg-background border-border shadow-lg rounded-xl">
                <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-destructive/10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-destructive/20 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold text-foreground">
                                {sessionId
                                    ? `Report session with ${reportedUserName}`
                                    : `Report ${reportedUserName}`}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-1">
                                Help us keep the platform safe by detailing your concern.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                        >
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Reason for Report
                            </label>
                            <Select
                                value={reason}
                                onValueChange={(value) => setReason(value as ReportReason)}

                            >
                                <SelectTrigger className="w-full bg-background h-11">
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ReportReason.HARASSMENT}>
                                        Harassment / Bullying
                                    </SelectItem>
                                    <SelectItem value={ReportReason.NO_SHOW}>
                                        No-Show for Session
                                    </SelectItem>
                                    <SelectItem value={ReportReason.INAPPROPRIATE_CONTENT}>
                                        Inappropriate Content
                                    </SelectItem>
                                    <SelectItem value={ReportReason.SPAM}>
                                        Spam or Scams
                                    </SelectItem>
                                    <SelectItem value={ReportReason.OTHER}>Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="space-y-2"
                        >
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Details & Evidence
                            </label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe what happened with clear details..."
                                rows={4}
                                disabled={isSubmitting}
                                className="bg-background resize-none focus-visible:ring-destructive"
                            />
                        </motion.div>
                    </div>

                    <DialogFooter className="p-4 px-6 border-t border-border/50 bg-secondary/20 flex flex-row justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Flag className="w-4 h-4" />
                                    Submit Report
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};