import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon, Filter, X, ChevronRight, BookOpen,
  Zap, User, Sparkles, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { publicSkillsApi, userSkillsApi, type Skill, type UserSkill, type UserSearchResponse } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

/* ─── Spring preset ──────────────────────────────────────── */
const spring = { type: "spring" as const, stiffness: 300, damping: 30, mass: 1 };

/* ─── Animation Variants ─────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

let searchTimer: ReturnType<typeof setTimeout>;

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [matchedSkills, setMatchedSkills] = useState<Skill[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<UserSearchResponse[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [mentors, setMentors] = useState<UserSkill[]>([]);
  const [showFilters, setShowFilters] = useState(false);
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
      const e = err as { message?: string };
      setError(e.message ?? "Failed to load mentors.");
      setMentors([]);
    } finally { setLoadingMentors(false); }
  }, []);

  const clearSearch = () => {
    setQuery(""); setMatchedSkills([]); setMatchedUsers([]);
    setSelectedSkill(null); setMentors([]); setError(null); setNameFilter("");
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-orange-400/20 border border-white/10 flex items-center justify-center mb-4">
            <SearchIcon className="w-6 h-6 text-violet-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-white mb-1">Find a Mentor</h1>
          <p className="text-white/45 text-sm">Search by skill to discover mentors who can teach you.</p>
        </motion.div>

        {/* Search bar */}
        <div className="relative mb-6 z-40">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                id="skill-search-input"
                placeholder="Search for a skill (e.g. Python, React, UI/UX)…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="w-full pl-10 pr-10 h-12 rounded-xl bg-black/30 border border-white/10
                  focus:border-white/30 text-white placeholder:text-white/30 text-base
                  outline-none transition-colors backdrop-blur-sm"
              />
              {query && (
                <button onClick={clearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 p-1 rounded-full hover:bg-white/8 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={spring}
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-all ${
                showFilters
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                  : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              <Filter className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Suggestion dropdown */}
          <AnimatePresence>
            {(matchedUsers.length > 0 || matchedSkills.length > 0 || loadingSkills) && !selectedSkill && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={spring}
                className="absolute top-full mt-2 left-0 right-[56px] z-50
                  bg-[#0f0f14]/95 backdrop-blur-2xl border border-white/10
                  rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
              >
                {loadingSkills ? (
                  <div className="px-4 py-4 text-sm text-white/40 flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full"
                    />
                    Searching community…
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    {matchedUsers.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1.5 text-xs font-semibold text-white/30 uppercase tracking-wider bg-white/[0.03]">People</div>
                        {matchedUsers.map(user => (
                          <button key={user.id} onClick={() => navigate(`/profile/${user.id}`)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-white/6 flex items-center justify-between group transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-400/10 border border-white/8 flex items-center justify-center text-orange-400">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-white/80 group-hover:text-white transition-colors">{user.fullName}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-orange-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                    {matchedSkills.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1.5 text-xs font-semibold text-white/30 uppercase tracking-wider bg-white/[0.03]">Skills</div>
                        {matchedSkills.slice(0, 8).map(skill => (
                          <button key={skill.id} onClick={() => selectSkill(skill)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-white/6 flex items-center justify-between group transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-white/8 flex items-center justify-center text-violet-400">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-medium block text-white/80 group-hover:text-white transition-colors">{skill.name}</span>
                                {skill.category && <span className="text-xs text-white/35">{skill.category}</span>}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-violet-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected skill + Name filter */}
        <AnimatePresence mode="wait">
          {selectedSkill && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-white/40">Showing mentors for:</span>
                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-sm rounded-lg gap-1.5 px-3 py-1">
                  <Sparkles className="w-3.5 h-3.5" /> {selectedSkill.name}
                  <button onClick={clearSearch} className="ml-1 hover:bg-violet-500/20 rounded-full p-0.5 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              </div>

              <AnimatePresence>
                {showFilters && mentors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="relative overflow-hidden"
                  >
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="name-filter-input"
                      placeholder="Filter results by mentor name…"
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="w-full pl-9 pr-9 h-11 rounded-xl bg-black/30 border border-white/10 focus:border-white/30 text-white placeholder:text-white/30 text-sm outline-none transition-colors backdrop-blur-sm"
                    />
                    {nameFilter && (
                      <button onClick={() => setNameFilter("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {/* Results */}
        {loadingMentors ? (
          <SkeletonList count={4} />
        ) : selectedSkill && mentors.length === 0 && !loadingMentors ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-white/40">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <BookOpen className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-semibold text-white/60">No mentors found for "{selectedSkill.name}"</p>
            <p className="text-sm mt-1 max-w-sm mx-auto">Try a different skill or check back later when new mentors join the community.</p>
          </motion.div>
        ) : !selectedSkill && !query ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-white/40">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <SearchIcon className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-semibold text-white/60">Search to find mentors</p>
            <p className="text-sm mt-1 max-w-sm mx-auto">Type a skill name above and select from the suggestions to see who can teach you.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {mentors
              .filter(us => !nameFilter || us.user.fullName.toLowerCase().includes(nameFilter.toLowerCase()))
              .map((us) => {
                const u = us.user;
                const initials = getInitials(u.fullName);
                return (
                  <motion.div
                    key={`${u.id}-${us.id.skillType}`}
                    variants={fadeUp}
                    transition={spring}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/profile/${u.id}`, { state: { skillId: selectedSkill?.id } })}
                    className="p-5 md:p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10
                      hover:bg-white/8 hover:border-white/18 shadow-xl shadow-black/20
                      cursor-pointer flex flex-col sm:flex-row items-start gap-4 group relative overflow-hidden transition-colors"
                  >
                    {/* Hover accent strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-orange-400 text-white flex items-center justify-center font-heading font-bold text-lg flex-shrink-0 shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-heading font-bold text-lg text-white/90 truncate group-hover:text-white transition-colors">
                            {u.fullName}
                          </h3>
                          <p className="text-sm text-white/40 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20">
                          <Zap className="w-3.5 h-3.5 fill-amber-400/40" />
                          <span className="text-xs font-bold">
                            Lv.{u.xpLevel ?? Math.floor((u.reputationScore ?? 0) / 10)}
                          </span>
                        </div>
                      </div>
                      {u.bio && <p className="text-sm text-white/40 line-clamp-2 mb-3 mt-2">{u.bio}</p>}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* XP Level badge — replaces the old ratingAvg star badge */}
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs font-medium gap-1 px-2.5 py-0.5">
                          <Zap className="w-3 h-3 fill-amber-400" />
                          XP Lv.{u.xpLevel ?? Math.floor((u.reputationScore ?? 0) / 10)}
                        </Badge>
                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs font-medium gap-1 px-2.5 py-0.5">
                          <GraduationCap className="w-3 h-3" /> Teaches {selectedSkill?.name}
                        </Badge>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-white/25 flex-shrink-0 mt-2 sm:mt-4 group-hover:text-violet-400 transition-colors hidden sm:block" />
                  </motion.div>
                );
              })}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Search;