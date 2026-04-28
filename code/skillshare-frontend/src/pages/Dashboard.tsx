import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

interface TimeSlot {
  day: string;
  startHour: number;
  endHour: number;
}

interface DraftProfile {
  name?: string;
  university?: string;
  major?: string;
  skills?: string[];
  timeSlots?: TimeSlot[];
}

const API_BASE_URL = "http://localhost:8080";

const Dashboard = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const draftProfileRaw = localStorage.getItem("userProfile");

        let draftProfile: DraftProfile | null = null;
        if (draftProfileRaw) {
          try {
            draftProfile = JSON.parse(draftProfileRaw);
          } catch (error) {
            console.error("Failed to parse local userProfile:", error);
          }
        }

        // Fallbacks from local draft/profile
        if (draftProfile?.name) {
          setUsername(draftProfile.name);
        }

        if (draftProfile?.skills && Array.isArray(draftProfile.skills)) {
          setSkills(draftProfile.skills);
        }

        if (draftProfile?.timeSlots && Array.isArray(draftProfile.timeSlots)) {
          setTimeSlots(draftProfile.timeSlots);
        }

        if (!userId) {
          console.warn("No userId found in localStorage. Showing fallback data only.");
          setViewCount(0);
          return;
        }
        //username
        let name = "";

        try {
          const res = await fetch(`/api/users/${userId}`);
          if (res.ok) {
            const data = await res.json();
            name = data.fullName || data.name || "";
          }
        } catch (e) {
          console.warn("Backend username not ready");
        }

        if (!name) {
          const draft = localStorage.getItem("profileDraft");
          if (draft) {
            const parsed = JSON.parse(draft);
            name = parsed.name || "";
          }
        }

        setUsername(name);

        // 2) TIME SLOTS
        // This matches the AvailabilityController route you showed:
        // GET /api/availability/mentor/{mentorId}
        try {
          const availabilityResponse = await fetch(
              `${API_BASE_URL}/api/availability/mentor/${userId}`
          );

          if (availabilityResponse.ok) {
            const availabilityData = await availabilityResponse.json();

            if (Array.isArray(availabilityData)) {
              const mappedSlots: TimeSlot[] = availabilityData.map((slot: any) => ({
                day: slot.day ?? "",
                startHour: slot.startHour ?? 0,
                endHour: slot.endHour ?? 0,
              }));

              setTimeSlots(mappedSlots);
            }
          } else {
            console.warn("Availability endpoint returned non-OK status.");
          }
        } catch (error) {
          console.warn("Could not fetch time slots from backend:", error);
        }
        // 3) MATCHES
        // TODO: replace with the real AvailabilityController matches endpoint once backend dev adds it.
        // Example possibilities:
        // GET /api/availability/matches/{userId}
        // GET /api/availability/matches/count/{userId}
        try {
          const matchesResponse = await fetch(
              `${API_BASE_URL}/api/availability/matches/${userId}`
          );

          if (matchesResponse.ok) {
            const matchesData = await matchesResponse.json();

            if (Array.isArray(matchesData)) {
              setMatchCount(matchesData.length);
            } else if (typeof matchesData?.count === "number") {
              setMatchCount(matchesData.count);
            }
          } else {
            console.warn("Matches endpoint not available yet.");
          }
        } catch (error) {
          console.warn("Could not fetch matches from backend yet:", error);
        }

        // 4) SKILLS
        let fetchedSkills: string[] = [];

        try {
          const res = await fetch(`/api/user-skills/user/${userId}`);
          if (res.ok) {
            const data = await res.json();
            fetchedSkills = data.map((s: any) => s.name || s.skill?.name || "");
          }
        } catch (e) {
          console.warn("Backend skills not ready");
        }

        if (fetchedSkills.length === 0) {
          const draft = localStorage.getItem("profileDraft");
          if (draft) {
            const parsed = JSON.parse(draft);
            fetchedSkills = parsed.skills || [];
          }
        }

        setSkills(fetchedSkills);

        // 5) VIEWS
        // No backend route yet, so keep this at 0 for now.
        setViewCount(0);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    getDashboardData();
  }, []);

  const hasSchedule = timeSlots.length > 0;

  if (loading) {
    return (
        <AppLayout>
          <div className="p-8 text-center">Loading your stats...</div>
        </AppLayout>
    );
  }

  return (
      <AppLayout>
        <div className="p-6 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
          {/* Welcome */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">
              Welcome back{username ? `, ${username.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your skill matching
            </p>
          </motion.div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                icon: Users,
                label: "Matches",
                value: matchCount,
                color: "bg-primary/10 text-primary",
              },
              {
                icon: Clock,
                label: "Time Slots",
                value: timeSlots.length,
                color: "bg-accent/10 text-accent",
              },
              {
                icon: Sparkles,
                label: "Skills",
                value: skills.length,
                color: "bg-blue-500/10 text-blue-500",
              },
              {
                icon: TrendingUp,
                label: "Views",
                value: viewCount,
                color: "bg-green-500/10 text-green-500",
              },
            ].map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-card border border-border"
                >
                  <div
                      className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-heading font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {!hasSchedule && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-2xl bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Action needed
                    </Badge>
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">
                    Set Your Schedule
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your free time slots to start getting matched with other students.
                  </p>
                  <Button onClick={() => navigate("/my-schedule")} className="gap-2">
                    Add Time Slots <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-2xl bg-accent/5 border border-accent/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <Badge className="bg-accent text-accent-foreground text-xs">
                  {matchCount} new
                </Badge>
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">
                View Your Matches
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                You have {matchCount} students who match your skills and schedule.
              </p>
              <Button
                  onClick={() => navigate("/search")}
                  variant="outline"
                  className="gap-2"
              >
                Find Matches <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          {/* Your skills */}
          {skills.length > 0 && (
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold">Your Skills</h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/profile/me")}>
                    Edit
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1">
                        {skill}
                      </Badge>
                  ))}
                </div>
              </motion.div>
          )}
        </div>
      </AppLayout>
  );
};

export default Dashboard;