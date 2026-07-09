import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, ChevronRight, BookOpen, Star, Filter, Users, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { publicSkillsApi, userSkillsApi, type Skill, type UserSkill, type UserSearchResponse } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

let searchTimer: ReturnType<typeof setTimeout>;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [matchedSkills, setMatchedSkills] = useState<Skill[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<UserSearchResponse[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [mentors, setMentors] = useState<UserSkill[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(searchTimer);
    if (!q.trim()) { setMatchedSkills([]); setMatchedUsers([]); return; }
    searchTimer = setTimeout(async () => {
      setLoadingSkills(true);
      try {
        const [skills, users] = await Promise.all([
          publicSkillsApi.search(q),
          userSkillsApi.searchProfiles(q)
        ]);
        setMatchedSkills(skills);
        setMatchedUsers(users);
      } catch {
        setMatchedSkills([]);
        setMatchedUsers([]);
      } finally { setLoadingSkills(false); }
    }, 350);
  }, []);

  const selectSkill = useCallback(async (skill: Skill) => {
    setSelectedSkill(skill);
    setMatchedSkills([]);
    setMatchedUsers([]);
    setQuery(skill.name);
    setLoadingMentors(true);
    setError(null);
    try {
      const result = await userSkillsApi.getMentorsBySkill(String(skill.id));
      setMentors(result);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load mentors.");
      setMentors([]);
    } finally { setLoadingMentors(false); }
  }, []);

  const clearSearch = () => {
    setQuery(""); setMatchedSkills([]); setSelectedSkill(null); setMentors([]); setError(null); setNameFilter("");
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-24 md:pb-8">
        
        {/* --- LEFT COLUMN: Main Search Content --- */}
        <div className="flex-1 max-w-3xl w-full">
          
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1 mb-6 p-5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-md">
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Find a Mentor</h1>
            <p className="text-white/90 text-sm">Discover experts to help you master new skills.</p>
          </motion.div>

          <div className="relative mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for a skill (e.g., Python, React)..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-10 pr-10 bg-secondary border-2 border-border/80 h-12 rounded-xl focus:border-violet-500 transition-colors"
              />
              {query && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {(matchedUsers.length > 0 || matchedSkills.length > 0) && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full mt-2 w-full z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                  {matchedUsers.map(u => (
                    <button key={u.id} onClick={() => navigate(`/profile/${u.id}`)} className="w-full text-left px-4 py-3 text-sm hover:bg-secondary flex items-center justify-between">
                      <span className="font-medium">{u.fullName}</span>
                      <Badge variant="outline">User</Badge>
                    </button>
                  ))}
                  {matchedSkills.map(s => (
                    <button key={s.id} onClick={() => selectSkill(s)} className="w-full text-left px-4 py-3 text-sm hover:bg-secondary flex items-center justify-between transition-colors">
                      <span className="font-medium">{s.name}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedSkill && (
            <div className="mb-6 flex items-center justify-between bg-secondary/50 p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mentors for:</span>
                <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20">{selectedSkill.name}</Badge>
              </div>
              <Input 
                placeholder="Filter by name..." 
                className="w-48 h-9 text-sm" 
                value={nameFilter} 
                onChange={(e) => setNameFilter(e.target.value)} 
              />
            </div>
          )}

          <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

          {loadingMentors ? <SkeletonList count={3} /> : (
            <div className="space-y-3">
              {mentors.filter(us => us.user.fullName.toLowerCase().includes(nameFilter.toLowerCase())).map((us, i) => (
                <motion.div 
                  key={us.id} 
                  variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/profile/${us.user.id}`, { state: { skillId: selectedSkill?.id } })}
                  className="p-5 rounded-2xl border-2 border-border/60 hover:border-violet-500/50 bg-card hover:bg-secondary/20 transition-all cursor-pointer flex items-start gap-4 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center font-bold text-violet-600">
                    {getInitials(us.user.fullName)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{us.user.fullName}</h3>
                      <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-500" /> {us.user.ratingAvg?.toFixed(1) ?? "New"}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{us.user.bio || "No bio available."}</p>
                    <div className="mt-3 flex gap-2">
                      <Badge variant="secondary">Rep: {us.user.reputationScore}</Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: Analytics Sidebar --- */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 space-y-6">
          <div className="p-6 rounded-2xl bg-card border-2 border-border/80 shadow-lg relative overflow-hidden">
             <h4 className="font-heading font-extrabold text-base mb-5 flex items-center gap-2.5">
               <Sparkles className="w-5 h-5 text-violet-500" /> Mentor Stats
             </h4>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Mentors</span>
                  <span className="font-bold">{mentors.length}</span>
                </div>
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                  <Users className="w-8 h-8 mx-auto text-violet-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Ready to help you grow your skills today.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Search;