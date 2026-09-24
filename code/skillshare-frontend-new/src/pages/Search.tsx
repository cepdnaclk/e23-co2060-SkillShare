import { useState, useCallback, useEffect, useRef } from "react";
import { Search as SearchIcon, X, ChevronRight, BookOpen, Star, Users2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { skillsApi } from "@/api/skills.api";
import { userSkillsApi } from "@/api/userSkills.api";
import { trendingApi } from "@/api/dashboard.api";
import { type Skill, type UserSkill, type UserSearchResponse, type UserPublicDto } from "@/api/types";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

let searchTimer: ReturnType<typeof setTimeout>;

const TREND_CATEGORIES = [
  "Development & Programming",
  "Design & Creative",
  "Data Science & AI",
  "Business & Finance"
];

const CATEGORY_MAPPER: Record<string, string> = {
  "Development & Programming": "Python",
  "Design & Creative": "UI/UX",
  "Data Science & AI": "Machine Learning",
  "Business & Finance": "Marketing"
};

const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trendMentors, setTrendMentors] = useState<UserPublicDto[]>([]);
  const [trendMentorsLoading, setTrendMentorsLoading] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedSkill && !query && selectedCategory) {
      setTrendMentorsLoading(true);
      const backendQueryValue = CATEGORY_MAPPER[selectedCategory] || selectedCategory;

      trendingApi.getTopMentorsByCategory(backendQueryValue)
        .then((result) => setTrendMentors(result))
        .catch(() => setTrendMentors([]))
        .finally(() => setTrendMentorsLoading(false));
    } else if (!selectedCategory) {
      setTrendMentors([]);
    }
  }, [selectedCategory, selectedSkill, query]);

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    setIsAutocompleteOpen(true);
    clearTimeout(searchTimer);
    if (!q.trim()) { setMatchedSkills([]); setMatchedUsers([]); return; }
    searchTimer = setTimeout(async () => {
      setLoadingSkills(true);
      try {
        const [skills, users] = await Promise.all([
          skillsApi.search(q),
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
    setQuery(skill.name);
    setIsAutocompleteOpen(false);
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
    setQuery("");
    setMatchedSkills([]);
    setSelectedSkill(null);
    setMentors([]);
    setError(null);
    setNameFilter("");
    setIsAutocompleteOpen(false);
  };

  const showEmptyState = !selectedSkill && !query && !selectedCategory;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">

        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Explore</h1>
          <p className="text-muted-foreground text-sm">Discover skills and people to connect with.</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-8" ref={autocompleteRef}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="skill-search-input"
              placeholder="Search for a skill (e.g. React) or a person..."
              value={query}
              onFocus={() => setIsAutocompleteOpen(true)}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10 pr-10 bg-background border-border h-12 shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
            />
            {query && (
              <button onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isAutocompleteOpen && (matchedUsers.length > 0 || matchedSkills.length > 0 || loadingSkills) && (
            <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-background border border-border rounded-xl shadow-sm overflow-hidden max-h-80 overflow-y-auto">
              {matchedUsers.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">People</div>
                  {matchedUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => navigate(`/profile/${user.id}`)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center justify-between"
                    >
                      <span className="font-medium text-foreground">{user.fullName}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
                    </button>
                  ))}
                </div>
              )}

              {(matchedSkills.length > 0 || loadingSkills) && (
                <div className="py-2 border-t border-border/50">
                  <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills</div>
                  {loadingSkills ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
                  ) : (
                    matchedSkills.slice(0, 8).map(skill => (
                      <button
                        key={skill.id}
                        onClick={() => selectSkill(skill)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center justify-between group"
                      >
                        <div>
                          <span className="font-medium text-foreground">{skill.name}</span>
                          {skill.category && (
                            <span className="ml-2 text-xs text-muted-foreground">{skill.category}</span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected skill header & Name filter */}
        {selectedSkill && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Showing results for</span>
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-sm font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                {selectedSkill.name}
                <button onClick={clearSearch} aria-label="Remove filter" className="hover:bg-muted-foreground/20 rounded-full p-0.5 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </div>

            {mentors.length > 0 && (
              <div className="relative max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name-filter-input"
                  placeholder="Filter by name..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="pl-9 pr-9 bg-secondary/50 border-transparent focus-visible:border-border focus-visible:bg-background h-10 text-sm rounded-lg"
                />
                {nameFilter && (
                  <button onClick={() => setNameFilter("")} aria-label="Clear name filter" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {/* Default View (Trending Categories) */}
        {!selectedSkill && !query && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">Discover Top Mentors</h2>
              <div className="flex flex-wrap gap-2">
                {TREND_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      selectedCategory === cat
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:border-foreground/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {selectedCategory && (
              <div>
                {trendMentorsLoading ? (
                  <SkeletonList count={3} />
                ) : trendMentors.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">No trending mentors found in this category.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {trendMentors.map((mentor) => (
                      <button
                        key={mentor.id}
                        onClick={() => navigate(`/profile/${mentor.id}`)}
                        className="flex flex-col p-5 rounded-2xl border border-border bg-card text-left transition-colors hover:border-foreground/20"
                      >
                        <div className="flex items-start gap-4 w-full">
                          <div className="w-12 h-12 shrink-0 rounded-full bg-secondary flex items-center justify-center font-medium text-foreground">
                            {getInitials(mentor.fullName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="font-semibold text-foreground truncate">{mentor.fullName}</h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {mentor.xp != null && (
                                <span className="flex items-center gap-1 text-foreground font-medium">
                                  <Star className="w-3.5 h-3.5 fill-current" /> {mentor.xp}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users2 className="w-3.5 h-3.5" /> {mentor.reputationScore} rep
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showEmptyState && (
               <div className="pt-12 text-center text-muted-foreground">
                 <p className="text-sm">Select a category above or search for a specific skill.</p>
               </div>
            )}
          </div>
        )}

        {/* Results layout logic */}
        {loadingMentors ? (
          <div className="mt-8"><SkeletonList count={4} /></div>
        ) : selectedSkill && mentors.length === 0 && !loadingMentors ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No mentors teach this skill yet.</p>
          </div>
        ) : selectedSkill && mentors.length > 0 ? (
          <div className="grid gap-4 mt-2">
            {mentors
              .filter(us => !nameFilter || us.userName.toLowerCase().includes(nameFilter.toLowerCase()))
              .map((us) => {
                const initials = getInitials(us.userName);
                return (
                  <button
                    key={`${us.userId}-${us.skillId}`}
                    onClick={() => navigate(`/profile/${us.userId}`, { state: { skillId: selectedSkill?.id } })}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-border bg-card text-left transition-colors hover:border-foreground/20 group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-secondary text-foreground flex items-center justify-center font-medium flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{us.userName}</h3>
                          {us.userRatingAvg != null && (
                            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                              <Star className="w-3 h-3 fill-current" />
                              {us.userRatingAvg.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            Teaches <span className="font-medium text-foreground">{selectedSkill.name}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users2 className="w-3 h-3" /> {us.userReputationScore}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity hidden sm:block" />
                  </button>
                );
              })}
          </div>
        ) : null}

      </div>
    </AppLayout>
  );
};

export default Search;