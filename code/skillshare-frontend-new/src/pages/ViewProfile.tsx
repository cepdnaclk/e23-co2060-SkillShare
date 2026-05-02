import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, Star, BookOpen, Coins, ChevronRight, Edit3, GraduationCap, Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  usersApi, userSkillsApi, availabilityApi, sessionsApi,
  type User, type UserSkill, type Availability, type ApiError
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SkeletonCard from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";


const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const ViewProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const location = useLocation();
  const preselectedSkillId = location.state?.skillId;

  const [mentor, setMentor] = useState<User | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking dialog
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);
  const [booking, setBooking] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null); // "skillId-skillType"

  useEffect(() => {
    if (!id || id === "undefined") {
      setLoading(false);
      setError("Invalid profile user ID.");
      return;
    }

    setLoading(true);

    Promise.all([
      usersApi.getById(id),
      userSkillsApi.getByUser(id).catch(() => [] as UserSkill[]),
      availabilityApi.getMentorSlots(id).catch(() => [] as Availability[]),
    ])
        .then(([u, sk, av]) => {
          setMentor(u);
          setSkills(sk);
          setSlots(av.filter(a => !a.isBooked));
        })
        .catch((err: ApiError) => {
          setError(err.message ?? "Could not load profile.");
        })
        .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (preselectedSkillId && skills.length > 0) {
      const matched = skills.find(
          s => s.id.skillId === preselectedSkillId && s.id.skillType === "TEACH"
      );

      if (matched) {
        setSelectedSkill(matched);
      }
    }
  }, [preselectedSkillId, skills]);


  const handleDeleteSkill = async (us: UserSkill) => {
    const key = `${us.id.skillId}-${us.id.skillType}`;
    if (deletingSkill === key) return; // prevent double-click
    setDeletingSkill(key);
    try {
      await userSkillsApi.remove(String(us.id.skillId), us.id.skillType);
      // Optimistically remove from local state
      setSkills(prev => prev.filter(s => !(s.id.skillId === us.id.skillId && s.id.skillType === us.id.skillType)));
      toast.success(`"${us.skill.name}" removed.`);
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Failed to remove skill.");
    } finally {
      setDeletingSkill(null);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedSkill || !me?.id) return;
    setBooking(true);
    try {
      await sessionsApi.book(me.id, selectedSkill.skill.id, selectedSlot.id);
      toast.success("Session booked! Waiting for mentor confirmation.");
      setBookingOpen(false);
      // Refresh slots
      if (id) availabilityApi.getMentorSlots(id).then(av => setSlots(av.filter(a => !a.isBooked)));
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Booking failed. Please try again.");
    } finally { setBooking(false); }
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-2xl skeleton-shimmer mx-auto mb-4" />
          <SkeletonCard lines={3} className="mb-4" />
          <SkeletonCard lines={4} />
        </div>
      </AppLayout>
    );
  }

  if (!mentor) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 text-center">
          <ErrorBanner error={error ?? "User not found"} />
          <Button onClick={() => navigate("/search")} className="mt-4">Back to Search</Button>
        </div>
      </AppLayout>
    );
  }

  const teachSkills = skills.filter(s => s.id.skillType === "TEACH");
  const learnSkills = skills.filter(s => s.id.skillType === "LEARN");
  const isOwnProfile = me?.id === mentor.id;

  // ── Owner / Edit Mode ────────────────────────────────────────────────────
  if (isOwnProfile) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
          <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

          {/* Profile header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-3xl mx-auto mb-4 animate-pulse-glow">
                {getInitials(mentor.fullName)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-background" title="Online" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-1">{mentor.fullName}</h1>
            <p className="text-muted-foreground text-sm">{mentor.email}</p>
            {mentor.bio && <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">{mentor.bio}</p>}

            <div className="flex items-center justify-center gap-4 mt-4">

              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Coins className="w-3.5 h-3.5 text-yellow-400" /> {mentor.credits} credits
              </span>
              <span className="flex items-center gap-1 text-sm text-accent">
                <Star className="w-3.5 h-3.5" /> Rep: {mentor.reputationScore}
              </span>
            </div>

            <Button
              className="mt-5 gap-2"
              onClick={() => navigate("/create-profile", { state: { startStep: 1 } })}
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </Button>
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <button
              onClick={() => navigate("/my-schedule")}
              className="p-4 rounded-2xl bg-card border border-border glow-border text-left hover:border-primary/40 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-sm">My Schedule</p>
              <p className="text-xs text-muted-foreground mt-0.5">Manage availability</p>
            </button>
            <button
              onClick={() => navigate("/sessions")}
              className="p-4 rounded-2xl bg-card border border-border glow-border text-left hover:border-primary/40 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="font-semibold text-sm">Sessions</p>
              <p className="text-xs text-muted-foreground mt-0.5">View all sessions</p>
            </button>
          </motion.div>

          {/* Teaching skills */}
          {teachSkills.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="mb-4 p-5 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" /> Skills I Teach
                </h3>
                <Button variant="ghost" size="sm"
                  onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}>
                  + Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {teachSkills.map(us => (
                  <Badge
                    key={us.id.skillId}
                    className="gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-primary/20 pr-1.5"
                  >
                    {us.skill.name}
                    <button
                      onClick={() => handleDeleteSkill(us)}
                      disabled={deletingSkill === `${us.id.skillId}-${us.id.skillType}`}
                      className="ml-0.5 rounded-sm opacity-60 hover:opacity-100 hover:text-destructive transition-opacity disabled:opacity-30"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Learning skills */}
          {learnSkills.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mb-4 p-5 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-accent" /> Skills I'm Learning
                </h3>
                <Button variant="ghost" size="sm"
                  onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}>
                  + Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {learnSkills.map(us => (
                  <Badge
                    key={us.id.skillId}
                    className="gap-1.5 px-3 py-1.5 bg-accent/10 text-accent border-accent/20 pr-1.5"
                  >
                    {us.skill.name}
                    <button
                      onClick={() => handleDeleteSkill(us)}
                      disabled={deletingSkill === `${us.id.skillId}-${us.id.skillType}`}
                      className="ml-0.5 rounded-sm opacity-60 hover:opacity-100 hover:text-destructive transition-opacity disabled:opacity-30"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Availability */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="p-5 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> My Availability Slots
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-schedule")}>Manage</Button>
            </div>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No slots added yet.</p>
            ) : (
              <div className="space-y-2">
                {slots.slice(0, 5).map(slot => (
                  <div key={slot.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary text-sm">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span>{fmt(slot.startTime)}</span>
                    <span className="text-muted-foreground">→ {fmt(slot.endTime)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // ── Public / Booking View ────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-2xl mx-auto mb-4 animate-pulse-glow">
            {getInitials(mentor.fullName)}
          </div>
          <h1 className="text-2xl font-heading font-bold mb-1">{mentor.fullName}</h1>
          {mentor.bio && <p className="text-muted-foreground text-sm max-w-md mx-auto">{mentor.bio}</p>}
          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 mt-4">

            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Coins className="w-3.5 h-3.5 text-yellow-400" /> {mentor.credits} credits
            </span>
            <span className="flex items-center gap-1 text-sm text-accent">
              <ChevronRight className="w-3.5 h-3.5" /> Rep: {mentor.reputationScore}
            </span>
          </div>
        </motion.div>

        {/* Teaching Skills */}
        {teachSkills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Teaching
            </h3>
            <div className="flex flex-wrap gap-2">
              {teachSkills.map(us => (
                <Badge key={us.id.skillId} className="px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
                  {us.skill.name}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Available Slots */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-6 p-5 rounded-2xl bg-card border border-border"
        >
          <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
            <Clock className="w-4 h-4 text-primary" /> Available Time Slots
          </h3>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No available slots right now.</p>
          ) : (
            <div className="space-y-2">
              {slots.map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span>{fmt(slot.startTime)}</span>
                    <span className="text-muted-foreground">→ {fmt(slot.endTime)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => { setSelectedSlot(slot); setBookingOpen(true); }}
                  >
                    Book
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>



        {/* Booking Dialog */}
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Book a Session</DialogTitle>
              <DialogDescription>Select the skill and a time slot to book with {mentor.fullName}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Skill section */}
              <div>
                <p className="text-sm font-medium mb-2">Skill</p>

                {preselectedSkillId ? (
                    // ✅ AUTO-SELECTED VIEW (from search)
                    <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                      {selectedSkill?.skill.name ?? "Selected from search"}
                    </div>
                ) : (
                    // ✅ NORMAL FLOW (manual selection)
                    <div className="flex flex-wrap gap-2">
                      {teachSkills.map(us => (
                          <button
                              key={us.id.skillId}
                              onClick={() => setSelectedSkill(us)}
                              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                  selectedSkill?.id.skillId === us.id.skillId
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-secondary border-border text-muted-foreground hover:border-primary/40"
                              }`}
                          >
                            {us.skill.name}
                          </button>
                      ))}
                    </div>
                )}
              </div>
              {/* Slot selection */}
              <div>
                <p className="text-sm font-medium mb-2">Choose a time slot</p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {slots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full text-left p-3 rounded-xl text-sm border transition-all ${
                        selectedSlot?.id === slot.id
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {fmt(slot.startTime)} → {fmt(slot.endTime)}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full h-11 gap-2"
                disabled={!selectedSkill || !selectedSlot || booking}
                onClick={handleBook}
              >
                {booking ? (
                  <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Booking…</>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ViewProfile;
