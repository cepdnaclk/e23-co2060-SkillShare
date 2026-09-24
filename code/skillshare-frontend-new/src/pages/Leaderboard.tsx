import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Medal, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { trendingApi } from "@/api/dashboard.api";
import type { UserPublicDto } from "@/api/types";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { parseAcademicBio } from "@/lib/academicBio";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

// Top 3 get a special medal treatment, everyone else cycles the theme colors
const RANK_STYLES = [
  { bg: "bg-amber-500", text: "text-amber-500", label: "1st" },
  { bg: "bg-slate-400", text: "text-slate-400", label: "2nd" },
  { bg: "bg-orange-500", text: "text-orange-500", label: "3rd" },
];

const Leaderboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserPublicDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trendingApi.getTopActiveUsers()
      .then(data => setUsers(data))
      .catch(() => setError("Failed to load the leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-2">The most active learners on SkillShare right now.</p>
        </motion.div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {loading ? (
          <SkeletonList count={6} />
        ) : users.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground rounded-xl border border-dashed border-border bg-card">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-foreground">No leaderboard data yet</p>
            <p className="text-sm mt-1">Check back once more sessions have been completed.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {users.map((user, i) => {
              const topThree = RANK_STYLES[i];
              return (
                <motion.div
                  key={user.id}
                  variants={fadeUp}
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className={`flex items-center gap-4 p-4 rounded-xl bg-card border cursor-pointer hover:shadow-sm hover:border-primary/30 transition-all`}
                >
                  {/* Rank badge */}
                  <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${topThree ? topThree.bg : "bg-secondary"} ${topThree ? "text-white" : "text-muted-foreground"}`}>
                    {topThree ? (
                      <Medal className="w-5 h-5" />
                    ) : (
                      <span className="font-bold text-sm">{i + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-11 h-11 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {getInitials(user.fullName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.fullName}</p>
                    {user.bio && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {parseAcademicBio(user.bio).cleanBio || user.bio}
                      </p>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border border-border text-xs font-semibold text-foreground">
                      <Trophy className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden />
                      <span>LVL {user.level ?? 1}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border border-border text-xs font-semibold text-foreground">
                      <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" aria-hidden />
                      <span>{user.xp ?? 0} XP</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
