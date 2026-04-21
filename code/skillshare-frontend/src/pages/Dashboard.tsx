import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Sparkles, ArrowRight, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

interface UserProfile {
  name: string;
  university: string;
  major: string;
  skills: string[];
  timeSlots?: { day: string; startHour: number; endHour: number }[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const hasSchedule = profile?.timeSlots && profile.timeSlots.length > 0;
  const matchCount = 4; // Mock data

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
            Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your skill matching
          </p>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Matches", value: matchCount, color: "bg-primary/10 text-primary" },
            { icon: Clock, label: "Time Slots", value: profile?.timeSlots?.length || 0, color: "bg-accent/10 text-accent" },
            { icon: Sparkles, label: "Skills", value: profile?.skills?.length || 0, color: "bg-blue-500/10 text-blue-500" },
            { icon: TrendingUp, label: "Views", value: 12, color: "bg-green-500/10 text-green-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
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
                <Badge variant="secondary" className="text-xs">Action needed</Badge>
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">Set Your Schedule</h3>
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
              <Badge className="bg-accent text-accent-foreground text-xs">{matchCount} new</Badge>
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">View Your Matches</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You have {matchCount} students who match your skills and schedule.
            </p>
            <Button onClick={() => navigate("/search")} variant="outline" className="gap-2">
              Find Matches <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Your skills */}
        {profile?.skills && profile.skills.length > 0 && (
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
              {profile.skills.map((skill) => (
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
