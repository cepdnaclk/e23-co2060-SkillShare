import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, ChevronRight, Users2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { trendingApi, type UserPublicDto } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

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
  { grad: "from-amber-400 to-yellow-500", label: "1st" },
  { grad: "from-slate-300 to-slate-400", label: "2nd" },
  { grad: "from-orange-400 to-amber-600", label: "3rd" },
];
const OTHER_COLORS = [
  "from-violet-500 to-purple-600",
  "from-fuchsia-500 to-orange-400",
  "from-purple-500 to-violet-600",
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-sm">The most active learners on SkillShare right now.</p>
        </motion.div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {loading ? (
          <SkeletonList count={6} />
        ) : users.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No leaderboard data yet</p>
            <p className="text-sm mt-1">Check back once more sessions have been completed.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
            {users.map((user, i) => {
              const topThree = RANK_STYLES[i];
              const grad = topThree ? topThree.grad : OTHER_COLORS[i % OTHER_COLORS.length];
              return (
                <motion.div
                  key={user.id}
                  variants={fadeUp}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className={`flex items-center gap-4 p-4 rounded-2xl bg-card border-2 cursor-pointer transition-colors ${
                    topThree ? "border-amber-400/30 hover:border-amber-400/60" : "border-border hover:border-violet-400/40"
                  }`}
                >
                  {/* Rank badge */}
                  <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-md`}>
                    {topThree ? (
                      <Medal className="w-5 h-5 text-white" />
                    ) : (
                      <span className="font-heading font-bold text-white text-sm">{i + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-11 h-11 shrink-0 rounded-full bg-violet-500/15 text-violet-500 flex items-center justify-center font-heading font-semibold text-sm">
                    {getInitials(user.fullName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.fullName}</p>
                    {user.bio && <p className="text-xs text-muted-foreground truncate">{user.bio}</p>}
                  </div>

                  <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    {user.reputationScore !== undefined && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> {user.reputationScore}
                      </span>
                    )}
                    {user.ratingAvg !== undefined && (
                      <span className="flex items-center gap-1">
                        <Users2 className="w-3.5 h-3.5 text-violet-400" /> {user.ratingAvg.toFixed(1)}
                      </span>
                    )}
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
