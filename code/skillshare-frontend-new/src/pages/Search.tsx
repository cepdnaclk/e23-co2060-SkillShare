import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Filter, X, ChevronRight, BookOpen, Star, Flame, Users2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { skillsApi as publicSkillsApi } from "@/api/skills.api";
import { userSkillsApi } from "@/api/userSkills.api";
import { trendingApi } from "@/api/dashboard.api";
import type { Skill, UserSkillDto as UserSkill, UserSearchResponse, UserPublicDto } from "@/api/types";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

// Debounce timers
let searchTimer: ReturnType<typeof setTimeout>;

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

  // ── Custom Trending states ───
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trendMentors, setTrendMentors] = useState<UserPublicDto[]>([]);
  const [trendMentorsLoading, setTrendMentorsLoading] = useState(false);

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
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const handleCategoryClick = (cat: string) => {
    if (selectedCategory === cat) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat);
    }
  };

  const showEmptyState = !selectedSkill && !query;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold text-foreground">Explore</h1>
          </div>
          <p className="text-muted-foreground text-base mb-6">Discover skills and connect with mentors</p>
        </motion.div>

        {/* Search bar */}
        <div className="relative mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="skill-search-input"
                placeholder="Search for a skill (e.g. Python, React, UI/UX)…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-12 pr-10 bg-card rounded-xl border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary h-14 text-base shadow-sm"
              />
              {query && (
                <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <Button
              size="icon"
              className={`h-14 w-14 rounded-xl border ${
                showFilters
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground hover:text-foreground border-border shadow-sm"
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Skill suggestion dropdown */}
          <AnimatePresence>
            {(matchedUsers.length > 0 || matchedSkills.length > 0 || loadingSkills) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-2 left-0 right-16 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
              >
                {matchedUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="w-full text-left px-5 py-3.5 text-sm hover:bg-muted/50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-foreground">{user.fullName}</span>
                      <span className="ml-2 text-xs text-primary">User</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
                {loadingSkills ? (
                  <div className="px-5 py-3.5 text-sm text-muted-foreground">Searching…</div>
                ) : (
                  matchedSkills.slice(0, 8).map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => selectSkill(skill)}
                      className="w-full text-left px-5 py-3.5 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-medium text-foreground">{skill.name}</span>
                        {skill.category && (
                          <span className="ml-2 text-xs text-muted-foreground">{skill.category}</span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Pills */}
        <div className="flex overflow-x-auto pb-4 mb-4 gap-2 scrollbar-none">
          {TREND_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                selectedCategory === cat 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card text-foreground border-border hover:border-primary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Selected skill header */}
        <AnimatePresence>
          {selectedSkill && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Showing mentors for:</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0 gap-1 px-3 py-1 text-sm rounded-full">
                  <BookOpen className="w-3.5 h-3.5" /> {selectedSkill.name}
                  <button onClick={clearSearch} className="ml-1 hover:text-primary-foreground hover:bg-primary rounded-full p-0.5 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </Badge>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name filter */}
        {selectedSkill && mentors.length > 0 && (
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name-filter-input"
              placeholder="Filter results by mentor name…"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="pl-11 pr-10 bg-card rounded-xl border-border h-12 text-sm shadow-sm"
            />
            {nameFilter && (
              <button onClick={() => setNameFilter("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {/* Results layout logic */}
        {loadingMentors ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <SkeletonList count={4} />
          </div>
        ) : selectedSkill && mentors.length === 0 && !loadingMentors ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-card rounded-xl border border-border shadow-sm">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-medium text-foreground text-lg">No mentors found for "{selectedSkill.name}"</p>
            <p className="text-sm text-muted-foreground mt-2">Try a different skill or check back later.</p>
          </motion.div>
        ) : showEmptyState ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            <div className="mb-8">
              {!selectedCategory ? (
                <div className="p-10 rounded-xl bg-card border border-border text-center shadow-sm">
                  <Flame className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-foreground font-medium">Select a category</p>
                  <p className="text-sm text-muted-foreground mt-1">Choose a category above to view trending mentors.</p>
                </div>
              ) : trendMentorsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SkeletonList count={4} />
                </div>
              ) : trendMentors.length === 0 ? (
                <div className="p-10 rounded-xl bg-card border border-border text-center shadow-sm">
                  <Users2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-foreground font-medium">No trending mentors</p>
                  <p className="text-sm text-muted-foreground mt-1">No one is currently trending in {selectedCategory}.</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Trending in {selectedCategory}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trendMentors.map((mentor, i) => (
                      <motion.div
                        key={mentor.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => navigate(`/profile/${mentor.id}`)}
                        className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-heading font-semibold text-sm">
                              {getInitials(mentor.fullName)}
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm border-2 border-card">
                              {i + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-heading font-semibold text-foreground truncate">{mentor.fullName}</h3>
                            <div className="flex items-center gap-1 text-primary mt-1">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="text-xs font-medium">{mentor.reputationScore} Rep</span>
                            </div>
                          </div>
                        </div>
                        {mentor.bio && <p className="text-sm text-muted-foreground line-clamp-2">{mentor.bio}</p>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentors
              .filter(us => !nameFilter || us.userName.toLowerCase().includes(nameFilter.toLowerCase()))
              .map((us, i) => {
                const initials = getInitials(us.userName);
                return (
                  <motion.div
                    key={`${us.userId}-${us.skillId}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/profile/${us.userId}`, { state: { skillId: selectedSkill?.id } })}
                    className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-heading font-semibold text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="font-heading font-semibold text-foreground truncate">{us.userName}</h3>
                          <div className="flex items-center gap-1 text-amber-500 shrink-0 ml-2">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-medium">{us.userRatingAvg?.toFixed(1) ?? "New"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <Users2 className="w-3.5 h-3.5" /> {us.userReputationScore} Rep
                          </span>
                        </div>
                      </div>
                    </div>
                    {us.userBio && <p className="text-sm text-muted-foreground line-clamp-2">{us.userBio}</p>}
                    <div className="mt-auto pt-2 flex flex-wrap gap-2">
                      <span className="skill-badge-teach">
                        Teaches {selectedSkill?.name}
                      </span>
                    </div>
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