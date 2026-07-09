import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Filter, X, ChevronRight, BookOpen, Star, Flame, Users2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { publicSkillsApi, userSkillsApi, trendingApi, type Skill, type UserSkill, type UserSearchResponse, type UserPublicDto } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

// Debounce timers
let searchTimer: ReturnType<typeof setTimeout>;

// Rank badge colors
const RANK_COLORS = [
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-400",
  "from-fuchsia-500 to-pink-500",
  "from-amber-500 to-orange-400",
  "from-purple-500 to-violet-600",
];

// Exact backend macro-categories
const TREND_CATEGORIES = [
  "Development & Programming",
  "Design & Creative",
  "Data Science & AI",
  "Business & Finance"
];

// Maps frontend dropdown items to backend keywords
const CATEGORY_MAPPER: Record<string, string> = {
  "Development & Programming": "Python",
  "Design & Creative": "UI/UX",
  "Data Science & AI": "Machine Learning",
  "Business & Finance": "Marketing"
};

const Search = () => {
  const navigate = useNavigate();

  // ── Main search bar ─────────────────────────
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

  // ── Custom Trending Dropdown Menu states ───
  // Changed initial state to null so it defaults to the placeholder text
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [trendMentors, setTrendMentors] = useState<UserPublicDto[]>([]);
  const [trendMentorsLoading, setTrendMentorsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch trending mentors automatically whenever the selected category changes
  useEffect(() => {
    if (!selectedSkill && !query && selectedCategory) {
      setTrendMentorsLoading(true);
      const backendQueryValue = CATEGORY_MAPPER[selectedCategory] || selectedCategory;

      trendingApi.getTopMentorsByCategory(backendQueryValue)
        .then((result) => setTrendMentors(result))
        .catch(() => setTrendMentors([]))
        .finally(() => setTrendMentorsLoading(false));
    } else if (!selectedCategory) {
      // Clear data if nothing has been chosen yet
      setTrendMentors([]);
    }
  }, [selectedCategory, selectedSkill, query]);

  // Search skills by query (debounced)
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

  // Select a skill from main search recommendations
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

  const showEmptyState = !selectedSkill && !query;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center">
              <SearchIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold">Find a Mentor</h1>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Search by skill to discover mentors who can teach you.</p>
        </motion.div>

        {/* Search bar */}
        <div className="relative mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
              <Input
                id="skill-search-input"
                placeholder="Search for a skill (e.g. Python, React, UI/UX)…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-10 pr-10 bg-secondary border-2 border-border focus-visible:border-violet-400 h-11"
              />
              {query && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              size="icon"
              className={`h-11 w-11 border-0 ${
                showFilters
                  ? "bg-gradient-to-br from-violet-500 to-orange-400 text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground border-2 border-border"
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Skill suggestion dropdown */}
          <AnimatePresence>
            {(matchedUsers.length > 0 || matchedSkills.length > 0 || loadingSkills) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1 left-0 right-12 z-50 bg-card border-2 border-violet-500/20 rounded-xl shadow-elevated overflow-hidden"
              >
                {matchedUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-secondary flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium">{user.fullName}</span>
                      <span className="ml-2 text-xs text-violet-400">User</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                ))}
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
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
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
                <Badge className="bg-gradient-to-r from-violet-500 to-orange-400 text-white border-0 gap-1">
                  <BookOpen className="w-3 h-3" /> {selectedSkill.name}
                  <button onClick={clearSearch}><X className="w-3 h-3 ml-1" /></button>
                </Badge>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name filter */}
        {selectedSkill && mentors.length > 0 && (
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name-filter-input"
              placeholder="Filter results by mentor name…"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="pl-10 pr-10 bg-secondary border-2 border-border h-10 text-sm"
            />
            {nameFilter && (
              <button onClick={() => setNameFilter("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {/* Results layout logic */}
        {loadingMentors ? (
          <SkeletonList count={4} />
        ) : selectedSkill && mentors.length === 0 && !loadingMentors ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No mentors found for "{selectedSkill.name}"</p>
            <p className="text-sm mt-1">Try a different skill or check back later.</p>
          </motion.div>
        ) : showEmptyState ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            {/* ── Trending List Widget Card ────────────────── */}
            <div className="relative rounded-3xl bg-gradient-to-br from-violet-500/10 to-orange-400/10 border-2 border-violet-500/25 overflow-visible">
              
              {/* Top Banner Badge */}
              <div className="flex justify-center -mt-4">
                <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 shadow-lg shadow-violet-500/30">
                  <Flame className="w-4 h-4 text-white" />
                  <span className="text-sm font-heading font-bold text-white">Trending List</span>
                </div>
              </div>

              <div className="p-6 pt-5">
                
                {/* Custom Dropdown Selection Input Bar */}
                <div className="relative" ref={dropdownRef}>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Select domain field</Label>
                  
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full bg-secondary border-2 rounded-xl px-4 h-11 text-sm font-medium transition-all cursor-pointer flex items-center justify-between select-none ${
                      isDropdownOpen ? 'border-orange-400 ring-2 ring-orange-400/10' : 'border-border hover:border-violet-500/30'
                    }`}
                  >
                    {/* Shows placeholder string if no active category select item exists */}
                    <span className={!selectedCategory ? "text-muted-foreground font-normal" : "text-foreground font-medium"}>
                      {selectedCategory || "Select Field of Expertise"}
                    </span>
                    <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-orange-400" />
                    </motion.div>
                  </div>

                  {/* Absolute Popup Options List Tray */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border-2 border-violet-500/20 rounded-xl shadow-elevated overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {TREND_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                              selectedCategory === cat 
                                ? "bg-orange-500/10 font-semibold text-orange-500" 
                                : "hover:bg-secondary text-foreground"
                            }`}
                          >
                            <span>{cat}</span>
                            {selectedCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Trending Mentors Query Segment Container */}
                <div className="mt-5">
                  {!selectedCategory ? (
                    <div className="p-5 rounded-2xl bg-card/40 text-center text-sm text-muted-foreground border border-dashed border-border">
                      Please pick a domain above to view trending mentors.
                    </div>
                  ) : trendMentorsLoading ? (
                    <SkeletonList count={3} />
                  ) : trendMentors.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-card/60 text-center text-sm text-muted-foreground">
                      No trending mentors for "{selectedCategory}" yet.
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Top mentors in {selectedCategory}
                      </p>
                      <div className="space-y-2">
                        {trendMentors.map((mentor, i) => (
                          <motion.button
                            key={mentor.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ x: 3 }}
                            onClick={() => navigate(`/profile/${mentor.id}`)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/70 hover:bg-card transition-colors text-left"
                          >
                            <div className={`w-8 h-8 shrink-0 rounded-full bg-gradient-to-br ${RANK_COLORS[i % RANK_COLORS.length]} flex items-center justify-center font-heading font-bold text-white text-xs shadow-sm`}>
                              {i + 1}
                            </div>
                            <div className="w-9 h-9 shrink-0 rounded-full bg-violet-500/15 text-violet-500 flex items-center justify-center font-heading font-semibold text-xs">
                              {getInitials(mentor.fullName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{mentor.fullName}</p>
                              {mentor.bio && <p className="text-xs text-muted-foreground truncate">{mentor.bio}</p>}
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-500 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-current" /> {mentor.reputationScore} Rep
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hint message label */}
            <div className="text-center py-8 text-muted-foreground">
              <SearchIcon className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Or use the search bar above to find a specific mentor.</p>
            </div>
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
                    onClick={() => navigate(`/profile/${u.id}`, { state: { skillId: selectedSkill?.id } })}
                    className="p-5 rounded-2xl bg-card border-2 border-border hover:border-violet-400/40 transition-colors cursor-pointer flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-orange-400 text-white flex items-center justify-center font-heading font-bold text-sm flex-shrink-0 shadow-md">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-heading font-semibold">{u.fullName}</h3>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="text-xs font-medium">{u.ratingAvg?.toFixed(1) ?? "New"}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{u.email}</p>
                      {u.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{u.bio}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users2 className="w-3 h-3" /> Rep: {u.reputationScore}
                        </span>
                        <Badge className="bg-gradient-to-r from-violet-500 to-orange-400 text-white border-0 text-xs">
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