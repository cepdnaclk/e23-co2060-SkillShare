import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, Star, BookOpen, Coins, ChevronRight } from "lucide-react";
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

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const ViewProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();

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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      usersApi.getById(id),
      userSkillsApi.getTeachingByUser(id).catch(() => [] as UserSkill[]),
      availabilityApi.getMentorSlots(id).catch(() => [] as Availability[]),
    ]).then(([u, sk, av]) => {
      setMentor(u);
      setSkills(sk);
      setSlots(av.filter(a => !a.isBooked));
    }).catch((err: ApiError) => {
      setError(err.message ?? "Could not load profile.");
    }).finally(() => setLoading(false));
  }, [id]);

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
  const isOwnProfile = me?.id === mentor.id;

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
            <span className="flex items-center gap-1 text-sm text-yellow-400">
              <Star className="w-3.5 h-3.5 fill-yellow-400" /> {mentor.ratingAvg?.toFixed(1)} rating
            </span>
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
                  {!isOwnProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => { setSelectedSlot(slot); setBookingOpen(true); }}
                    >
                      Book
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Action buttons */}
        {!isOwnProfile && slots.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button className="w-full h-11 gap-2" onClick={() => setBookingOpen(true)}>
              <Calendar className="w-4 h-4" /> Book a Session
            </Button>
          </motion.div>
        )}

        {/* Booking Dialog */}
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Book a Session</DialogTitle>
              <DialogDescription>Select the skill and a time slot to book with {mentor.fullName}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Skill selection */}
              <div>
                <p className="text-sm font-medium mb-2">Choose a skill</p>
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
