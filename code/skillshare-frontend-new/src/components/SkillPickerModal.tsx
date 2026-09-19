import { useState, useEffect, useRef } from "react";
import { Search, X, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { publicSkillsApi, trendingApi, type Skill, type TrendingSkillDto } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface SkillPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "TEACH" | "LEARN";
  onAdd: (name: string, type: "TEACH" | "LEARN") => void | Promise<void>;
  existingTeach: string[];
  existingLearn: string[];
}

const normalize = (s: string) => s.trim().toLowerCase();

export const SkillPickerModal = ({ open, onOpenChange, type, onAdd, existingTeach, existingLearn }: SkillPickerModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Skill[]>([]);
  const [searching, setSearching] = useState(false);
  const [trending, setTrending] = useState<TrendingSkillDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      trendingApi.getTopSharingSkills().then(setTrending).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await publicSkillsApi.search(query);
        setResults(res);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [query]);

  const handleSelect = async (name: string) => {
    const normalized = normalize(name);
    const opposite = type === "TEACH" ? existingLearn : existingTeach;
    const same = type === "TEACH" ? existingTeach : existingLearn;

    if (opposite.some(s => normalize(s) === normalized)) {
      toast.error(`"${name.trim()}" is already in ${type === "TEACH" ? "I Want To Learn" : "I Can Teach"}.`);
      return;
    }

    if (same.some(s => normalize(s) === normalized)) {
      toast.error(`You already added "${name.trim()}".`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(name.trim(), type);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to add skill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden gap-0 bg-background border-border shadow-lg rounded-xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-secondary/30">
          <DialogTitle className="text-xl text-foreground font-semibold">
            Add to "{type === "TEACH" ? "I Can Teach" : "I Want To Learn"}"
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Search for a skill or enter a custom one.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Python, Marketing, Guitar..."
              className="pl-10 h-11 bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  e.preventDefault();
                  handleSelect(query);
                }
              }}
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="min-h-[160px] max-h-[240px] overflow-y-auto pr-2 -mr-2">
            <AnimatePresence mode="popLayout">
              {query.trim() && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Search Results</p>
                  {searching ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching...
                    </div>
                  ) : results.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {results.map(r => (
                        <button key={r.id} onClick={() => handleSelect(r.name)} disabled={isSubmitting} className="text-left px-3 py-2.5 rounded-lg hover:bg-secondary text-sm font-medium transition-colors text-foreground flex items-center justify-between group">
                          {r.name}
                          <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                      <div className="my-2 border-t border-border/50" />
                      <button onClick={() => handleSelect(query)} disabled={isSubmitting} className="text-left px-3 py-2.5 rounded-lg hover:bg-secondary text-sm font-medium transition-colors text-primary flex items-center justify-between">
                        Add "{query}" as custom skill
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">No exact matches found.</p>
                      <Button onClick={() => handleSelect(query)} disabled={isSubmitting} variant="secondary" className="w-full">
                        Add "{query}" as custom skill
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {!query.trim() && trending.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Suggested Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {trending.slice(0, 10).map(t => {
                      const normalized = normalize(t.name);
                      const isConflict = type === "TEACH" 
                        ? existingLearn.some(s => normalize(s) === normalized)
                        : existingTeach.some(s => normalize(s) === normalized);
                      const isAdded = type === "TEACH"
                        ? existingTeach.some(s => normalize(s) === normalized)
                        : existingLearn.some(s => normalize(s) === normalized);
                      
                      return (
                        <Badge 
                          key={t.skillId} 
                          variant="outline"
                          onClick={() => { if (!isConflict && !isAdded && !isSubmitting) handleSelect(t.name); }}
                          className={`px-3 py-1.5 transition-all ${isAdded ? "bg-primary text-primary-foreground border-primary" : isConflict ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-secondary hover:scale-105 active:scale-95"}`}
                        >
                          {t.name}
                        </Badge>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
