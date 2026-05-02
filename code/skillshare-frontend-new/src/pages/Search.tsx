import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Filter, X, ChevronRight, BookOpen, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { publicSkillsApi, userSkillsApi, type Skill, type UserSkill ,type UserSearchResponse } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

// Debounce timer
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

  // Search skills by query (debounced)
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(searchTimer);
    if (!q.trim()) { setMatchedSkills([]); setMatchedUsers([]); return; }
    searchTimer = setTimeout(async () => {
      setLoadingSkills(true);
      try {
        const [skills,users]  = await Promise.all([
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

  // When a skill is selected, fetch mentors for it
  const selectSkill = useCallback(async (skill: Skill) => {
    setSelectedSkill(skill);
    setMatchedSkills([]);
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
    setQuery(""); setMatchedSkills([]); setSelectedSkill(null); setMentors([]); setError(null); setNameFilter("");
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Find a Mentor</h1>
          <p className="text-muted-foreground text-sm mb-6">Search by skill to discover mentors who can teach you.</p>
        </motion.div>

        {/* Search bar */}
        <div className="relative mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="skill-search-input"
                placeholder="Search for a skill (e.g. Python, React, UI/UX)…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-10 pr-10 bg-secondary border-border h-11"
              />
              {query && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              className="h-11 w-11"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Skill suggestion dropdown */}
          <AnimatePresence>
            {matchedUsers.map(user => (
                <button
                    key={user.id}
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-secondary flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium">{user.fullName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">User</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
            ))}
            {(matchedSkills.length > 0 || loadingSkills) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1 left-0 right-12 z-50 bg-card border border-border rounded-xl shadow-elevated overflow-hidden"
              >
                {loadingSkills ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Searching skills…</div>
                ) : (
                  matchedSkills.slice(0, 8).map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => selectSkill(skill)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-secondary transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-medium">{skill.name}</span>
                        {skill.category && (
                          <span className="ml-2 text-xs text-muted-foreground">{skill.category}</span>
                        )}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected skill header */}
        <AnimatePresence>
          {selectedSkill && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Showing mentors for:</span>
                <Badge className="bg-primary/15 text-primary border-primary/20 gap-1">
                  <BookOpen className="w-3 h-3" /> {selectedSkill.name}
                  <button onClick={clearSearch}><X className="w-3 h-3 ml-1" /></button>
                </Badge>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name filter – only visible when mentors are loaded */}
        {selectedSkill && mentors.length > 0 && (
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name-filter-input"
              placeholder="Filter results by mentor name…"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="pl-10 pr-10 bg-secondary border-border h-10 text-sm"
            />
            {nameFilter && (
              <button onClick={() => setNameFilter("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {/* Results */}
        {loadingMentors ? (
          <SkeletonList count={4} />
        ) : selectedSkill && mentors.length === 0 && !loadingMentors ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No mentors found for "{selectedSkill.name}"</p>
            <p className="text-sm mt-1">Try a different skill or check back later.</p>
          </motion.div>
        ) : !selectedSkill && !query ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Search for a skill to find mentors</p>
            <p className="text-sm mt-1">Type a skill name above and select from the suggestions.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {mentors
              .filter(us => !nameFilter || us.user.fullName.toLowerCase().includes(nameFilter.toLowerCase()))
              .map((us, i) => {
              const u = us.user;
              const initials = getInitials(u.fullName);
              return (
                <motion.div
                  key={`${u.id}-${us.id.skillType}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/profile/${u.id}`, { state: { skillId: selectedSkill?.id } })}                  className="p-5 rounded-2xl bg-card border border-border glow-border cursor-pointer flex items-start gap-4"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-heading font-semibold">{u.fullName}</h3>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-3.5 h-3.5 fill-yellow-400" />
                        <span className="text-xs font-medium">{u.ratingAvg?.toFixed(1) ?? "New"}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{u.email}</p>
                    {u.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{u.bio}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" /> Rep: {u.reputationScore}
                      </span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        Teaches {selectedSkill?.name}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Search;
