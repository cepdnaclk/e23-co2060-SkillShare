import { Search, Trophy, Coins, Flame, LucideIcon } from "lucide-react";

interface DashboardHeaderProps {
    xp: number;
    level: number;
    credits: number;
    onSearchClick: () => void;
}

export default function DashboardHeader({
    xp = 0,
    level = 1,
    credits = 0,
    onSearchClick,
}: DashboardHeaderProps) {
    return (
        <header className="w-full border-b border-border bg-background px-6 py-3 sticky top-0 z-20 flex items-center justify-end gap-2">

            {/* Search button */}
            <button
                onClick={onSearchClick}
                aria-label="Search"
                className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-border bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 hover:text-foreground transition-colors duration-150"
            >
                <Search className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                <span className="hidden sm:inline">Search</span>
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-border mx-0.5" aria-hidden />

            {/* Level chip */}
            <StatChip
                icon={Trophy}
                label={`Lvl ${level}`}
                title={`Level ${level}`}
            />

            {/* XP chip */}
            <StatChip
                icon={Flame}
                label={`${xp} XP`}
                title={`${xp} experience points`}
            />

            {/* Credits chip */}
            <StatChip
                icon={Coins}
                label={`${credits}`}
                title={`${credits} credits`}
            />

        </header>
    );
}

/* ── Minimal stat chip ─────────────────────────────────────────── */
interface StatChipProps {
    icon: LucideIcon;
    label: string;
    title: string;
}

function StatChip({ icon: Icon, label, title }: StatChipProps) {
    return (
        <div
            className="flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-secondary border border-border text-xs font-medium text-muted-foreground select-none"
            title={title}
        >
            <Icon className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" aria-hidden />
            <span className="text-foreground">{label}</span>
        </div>
    );
}