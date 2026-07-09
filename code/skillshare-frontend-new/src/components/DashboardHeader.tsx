import { useState } from "react";
import { Search, Flame, Trophy, Coins, Sparkles, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
        <header className="w-full bg-background/60 backdrop-blur-md border-b border-border/40 px-4 py-3 sticky top-0 z-50 flex items-center justify-end gap-2.5 sm:gap-3 max-w-6xl mx-auto rounded-b-2xl">

            {/* 1. SEARCH CHIP (Textless, styled to match the array seamlessly) */}
            <HeaderChipWithTooltip
                title="Search"
                titleColor="text-foreground"
                tooltipText="Find courses, skills, or peer mentors instantly."
                emoji="🔍"
                Icon={Search}
                iconColor="text-muted-foreground"
            >
                <button
                    onClick={onSearchClick}
                    className="flex items-center justify-center w-9 h-9 sm:h-8 rounded-xl bg-secondary/40 border border-border/60 hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-200 group"
                >
                    <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
            </HeaderChipWithTooltip>

            {/* 2. LEVEL CHIP */}
            <HeaderChipWithTooltip
                title={`Level ${level}`}
                titleColor="text-purple-400"
                tooltipText={`Keep learning and sharing skills to reach Level ${level + 1}!`}
                emoji="👑"
                Icon={Trophy}
                iconColor="text-purple-500"
            >
                <div className="flex items-center gap-1.5 px-3 py-1.5 h-9 sm:h-8 rounded-xl bg-purple-500/[0.06] border border-purple-500/20 text-xs font-black tracking-tight text-purple-400 select-none">
                    <Trophy className="w-4 h-4 text-purple-500 fill-purple-500/10" />
                    <span className="uppercase text-[10px] tracking-wider font-extrabold opacity-70">LVL</span>
                    <span>{level}</span>
                </div>
            </HeaderChipWithTooltip>

            {/* 3. XP CHIP */}
            <HeaderChipWithTooltip
                title={`${xp} Total XP`}
                titleColor="text-orange-400"
                tooltipText={`${100 - (xp % 100)} more XP until your next level milestone.`}
                emoji="⚡"
                Icon={Flame}
                iconColor="text-orange-500"
            >
                <div className="flex items-center gap-1.5 px-3 py-1.5 h-9 sm:h-8 rounded-xl bg-orange-500/[0.06] border border-orange-500/20 text-xs font-black tracking-tight text-orange-400 select-none">
                    <Flame className="w-4 h-4 fill-orange-500/10 text-orange-500 animate-pulse" />
                    <span>{xp}</span>
                    <span className="uppercase text-[10px] font-bold text-orange-500/70">XP</span>
                </div>
            </HeaderChipWithTooltip>

            {/* 4. CREDITS CHIP */}
            <HeaderChipWithTooltip
                title={`${credits} Balance`}
                titleColor="text-sky-400"
                tooltipText="Spend credits to book sessions or earn them by teaching others."
                emoji="💎"
                Icon={Coins}
                iconColor="text-sky-400"
            >
                <div className="flex items-center gap-1.5 px-3 py-1.5 h-9 sm:h-8 rounded-xl bg-sky-500/[0.06] border border-sky-500/20 text-xs font-black tracking-tight text-sky-400 select-none">
                    <div className="relative flex items-center justify-center">
                        <Coins className="w-4 h-4 text-sky-400 fill-sky-500/10" />
                        <Sparkles className="w-2 h-2 text-sky-300 absolute -top-1 -right-1 opacity-80" />
                    </div>
                    <span>{credits}</span>
                </div>
            </HeaderChipWithTooltip>

        </header>
    );
}

// ── REUSABLE GAMIFIED STICKER POPUP WRAPPER ──
interface TooltipProps {
    children: React.ReactNode;
    title: string;
    titleColor: string;
    tooltipText: string;
    emoji: string;
    Icon: LucideIcon;
    iconColor: string;
}

function HeaderChipWithTooltip({
                                   children,
                                   title,
                                   titleColor,
                                   tooltipText,
                                   emoji,
                                   Icon,
                                   iconColor
                               }: TooltipProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="relative flex flex-col items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Target Anchor Component */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {children}
            </motion.div>

            {/* Duolingo Sticker Card Dialog */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.93 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="absolute top-full mt-2.5 z-50 w-52 p-4 rounded-2xl bg-popover/95 backdrop-blur-md text-popover-foreground border border-border/80 shadow-[0_12px_30px_rgba(0,0,0,0.2)] pointer-events-none text-center"
                    >
                        {/* Arrow Pin */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-popover border-t border-l border-border/80" />

                        {/* Centered Large Sticker Graphic */}
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-secondary/60 border border-border/40 text-xl shadow-inner">
                                <span>{emoji}</span>
                                <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-md bg-popover border border-border shadow-sm`}>
                                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                                </div>
                            </div>

                            {/* Typography Structure */}
                            <div className="flex flex-col gap-0.5 mt-1">
                                <h4 className={`text-xs font-black tracking-wider uppercase ${titleColor}`}>
                                    {title}
                                </h4>
                                <p className="text-[11.5px] leading-relaxed font-semibold text-muted-foreground px-1">
                                    {tooltipText}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}