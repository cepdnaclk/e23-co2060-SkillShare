import { useState } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, Filter, MapPin, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

const MOCK_STUDENTS = [
  {
    id: "1",
    name: "Sarah Chen",
    university: "MIT",
    major: "Computer Science",
    avatar: "SC",
    skills: ["Python", "Machine Learning", "Data Science", "React"],
    bio: "CS junior passionate about AI and web dev.",
    commonSlots: 2,
    location: "Campus Library",
    shareLocation: true,
  },
  {
    id: "2",
    name: "James Wilson",
    university: "Stanford",
    major: "Design",
    avatar: "JW",
    skills: ["Figma", "UI/UX", "React", "JavaScript"],
    bio: "Design student who loves building interfaces.",
    commonSlots: 1,
    location: "Design Studio",
    shareLocation: true,
  },
  {
    id: "3",
    name: "Aisha Patel",
    university: "MIT",
    major: "Mathematics",
    avatar: "AP",
    skills: ["Python", "Statistics", "Data Science", "R"],
    bio: "Math enthusiast exploring data science.",
    commonSlots: 3,
    shareLocation: false,
  },
  {
    id: "4",
    name: "Marcus Lee",
    university: "Stanford",
    major: "Engineering",
    avatar: "ML",
    skills: ["JavaScript", "React", "Node.js", "TypeScript"],
    bio: "Full-stack developer and open source contributor.",
    commonSlots: 2,
    location: "Engineering Lab",
    shareLocation: true,
  },
];

const ALL_SKILLS = Array.from(new Set(MOCK_STUDENTS.flatMap((s) => s.skills)));

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredStudents = MOCK_STUDENTS.filter((student) => {
    const matchesQuery =
      !query ||
      student.name.toLowerCase().includes(query.toLowerCase()) ||
      student.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()));
    const matchesSkills =
      selectedSkills.length === 0 ||
      selectedSkills.some((skill) => student.skills.includes(skill));
    return matchesQuery && matchesSkills;
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Find Students</h1>
          <p className="text-muted-foreground mb-6">Search by name or skill</p>
        </motion.div>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students or skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 rounded-xl bg-secondary"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">Filter by skill:</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedSkills.includes(skill)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setSelectedSkills([])}
              >
                <X className="w-3 h-3 mr-1" /> Clear filters
              </Button>
            )}
          </motion.div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No students found</p>
            </div>
          ) : (
            filteredStudents.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/profile/${student.id}`)}
                className="p-5 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-sm flex-shrink-0">
                    {student.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-heading font-bold">{student.name}</h3>
                      <span className="text-xs text-muted-foreground">{student.university}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{student.major}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {student.skills.slice(0, 4).map((skill) => (
                        <Badge
                          key={skill}
                          variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {student.skills.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{student.skills.length - 4} more
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {student.commonSlots} common slots
                      </span>
                      {student.shareLocation && student.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-accent" />
                          {student.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Search;
