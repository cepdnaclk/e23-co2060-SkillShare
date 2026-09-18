import { useEffect, useState } from "react";
import { Trophy, ChevronRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { trendingApi, type UserPublicDto } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

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
      <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Leaderboard</h1>
            <p className="text-muted-foreground text-sm">The most active users in the community.</p>
          </div>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {loading ? (
          <SkeletonList count={6} />
        ) : users.length === 0 ? (
          <div className="py-16 text-center bg-secondary/30 rounded-xl border border-border/50">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20 text-foreground" />
            <p className="text-sm text-foreground font-medium">No leaderboard data yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Check back once more sessions have been completed.</p>
          </div>
        ) : (
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-border/50">
              {users.map((user, i) => {
                const rank = i + 1;
                const isTopThree = rank <= 3;
                
                return (
                  <button
                    key={user.id}
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="w-full flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-secondary/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      
                      {/* Rank Indicator */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        rank === 1 ? "bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400" :
                        rank === 2 ? "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-500/20 dark:border-slate-500/30 dark:text-slate-400" :
                        rank === 3 ? "bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-orange-400" :
                        "bg-secondary border-border text-muted-foreground font-medium"
                      }`}>
                        <span className="text-[13px] font-semibold">{rank}</span>
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 shrink-0 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-xs font-medium text-foreground overflow-hidden">
                        {user.profilePictureUrl ? (
                          <img src={user.profilePictureUrl} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(user.fullName)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.university || "No university listed"}
                          {user.major && ` • ${user.major}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0 mt-2 sm:mt-0 ml-12 sm:ml-0">
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
