import { motion } from "framer-motion";
import { MapPin, Clock, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Match } from "@/hooks/useSkillShare";

interface MatchResultsProps {
  matches: Match[];
  hasProfile: boolean;
}

const formatHour = (h: number) => {
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${period}`;
};

const MatchResults = ({ matches, hasProfile }: MatchResultsProps) => {
  if (!hasProfile) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-lg font-heading font-semibold mb-2">Complete Your Profile First</h3>
        <p className="text-muted-foreground text-sm">Add your skills and time slots to find matches.</p>
      </motion.div>
    );
  }

  if (matches.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-lg font-heading font-semibold mb-2">No Matches Yet</h3>
        <p className="text-muted-foreground text-sm">Try adding more skills or expanding your availability.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-heading font-bold mb-1">Your Matches</h2>
        <p className="text-muted-foreground">
          Found <span className="text-primary font-semibold">{matches.length}</span> student{matches.length > 1 ? "s" : ""} who match your skills and schedule.
        </p>
      </div>

      <div className="space-y-4">
        {matches.map((match, i) => (
          <motion.div
            key={match.student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-sm flex-shrink-0">
                {match.student.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-heading font-bold text-lg">{match.student.name}</h3>
                  <span className="text-xs text-muted-foreground">{match.student.university}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{match.student.major} • {match.student.bio}</p>

                {/* Common skills */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Shared Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.commonSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Common time slots */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Common Free Time
                  </p>
                  <div className="space-y-1">
                    {match.commonSlots.map((slot, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="font-medium">{slot.day}</span>
                        <span className="text-muted-foreground">
                          {formatHour(slot.startHour)} — {formatHour(slot.endHour)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location */}
                {match.student.shareLocation && match.student.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span>{match.student.location}</span>
                  </div>
                )}

                <div className="mt-4">
                  <Button size="sm" className="rounded-lg">Connect</Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MatchResults;
