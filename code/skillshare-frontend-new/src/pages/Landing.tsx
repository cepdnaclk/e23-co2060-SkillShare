import { InteractiveDots } from "@/components/InteractiveDots";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Sun,
  Moon,
  BookOpen,
  Compass,
  Users,
  ArrowLeftRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

/* ─── Animation variants ─────────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

/* ─── Static skill data ───────────────────────────────────────────────────── */
const teachSkills = [
  "Python", "UI/UX Design", "Machine Learning", "Guitar",
  "Photography", "Public Speaking", "Calculus", "React",
];

const learnSkills = [
  "Video Editing", "Digital Marketing", "Data Analysis", "Piano",
  "3D Modelling", "Game Dev", "Spanish", "Finance",
];


/* ─── How It Works steps ─────────────────────────────────────────────────── */
const steps = [
  {
    num: "01",
    title: "Share",
    desc: "Tell people what you can teach - any skill, any level.",
  },
  {
    num: "02",
    title: "Discover",
    desc: "Find people who know what you want to learn and whose schedule fits yours.",
  },
  {
    num: "03",
    title: "Learn together",
    desc: "Schedule a session, exchange knowledge, and grow alongside each other.",
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════════════════════════ */
const Landing = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── 1. NAVIGATION ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Wordmark - no gap between Skill and Share */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 font-semibold text-base select-none focus:outline-none"
          >
            <img src="/skillshare.png" alt="SkillShare Logo" className="w-7 h-7 object-contain flex-shrink-0" />
            <span>
              <span className="text-foreground">Skill</span>
              <span className="text-primary">Share</span>
            </span>
          </button>

          {/* Right nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/signup", { state: { tab: "signin" } })}
            >
              Log in
            </Button>

            <Button
              size="sm"
              onClick={() => navigate("/signup", { state: { tab: "signup" } })}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* ── 2. HERO ───────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-16">
        {/* Dot-grid texture - barely visible */}
        <InteractiveDots />
        {/* Extremely subtle primary-blue atmospheric centre - stays almost white */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 40%, hsl(var(--primary) / 0.045) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          {/* Eyebrow */}
          <motion.p
            variants={fadeUp}
            className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-10"
          >
            Peer-to-peer skill sharing
          </motion.p>

          {/* Primary statement - the product identity */}
          <motion.h1
            variants={fadeUp}
            className="text-[clamp(2.25rem,6vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.025em] text-foreground mb-3"
          >
            Everyone has something
            <br />
            <span className="text-primary">to teach.</span>
          </motion.h1>

          {/* Secondary statement - echoes, slightly smaller */}
          <motion.p
            variants={fadeUp}
            className="text-[clamp(1.25rem,3.5vw,1.875rem)] font-semibold leading-snug tracking-[-0.02em] text-muted-foreground mb-8"
          >
            Everyone has something to learn.
          </motion.p>

          {/* Supporting copy - one sentence, no jargon */}
          <motion.p
            variants={fadeUp}
            className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed"
          >
            Share what you know. Learn from someone else.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-2.5 justify-center mb-10"
          >
            <Button
              size="lg"
              className="gap-2 px-8"
              onClick={() => navigate("/signup", { state: { tab: "signup" } })}
            >
              Get started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              How it works
            </Button>
          </motion.div>

          {/* Popular skills - very subtle, no interactive affordance */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-1.5 justify-center">
            <span className="text-xs text-muted-foreground/60 self-center mr-1">Popular:</span>
            {["Python", "UI/UX Design", "Photography", "Guitar", "Public Speaking", "Machine Learning"].map((skill) => (
              <span
                key={skill}
                className="text-xs px-2.5 py-1 h-6 rounded-full border border-border/60 text-muted-foreground/70 select-none"
              >
                {skill}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── 3. TEACH ↔ LEARN - the conceptual centerpiece ─────────────────── */}
      <section className="border-y border-border bg-secondary/25">
        <div className="max-w-6xl mx-auto px-6 py-20">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.28 }}
            className="text-center mb-12"
          >
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-3">
              One profile. Two sides.
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-3">
              Every person is both a teacher and a learner.
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Share what you know and discover what you want to learn.
            </p>
          </motion.div>

          {/* Two-sided layout - cards with connector */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-[1fr_64px_1fr] gap-3 md:gap-0 items-stretch"
          >
            {/* I Can Teach */}
            <motion.div
              variants={fadeUp}
              className="rounded-lg border p-6 sm:p-7"
              style={{
                background: "hsl(var(--teach-bg))",
                borderColor: "hsl(var(--teach-border))",
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <BookOpen
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "hsl(var(--teach-text))" }}
                />
                <div>
                  <p
                    className="text-[11px] font-semibold tracking-[0.1em] uppercase leading-none mb-0.5"
                    style={{ color: "hsl(var(--teach-text))" }}
                  >
                    I Can Teach
                  </p>
                  <p className="text-xs text-muted-foreground">Skills I share with others</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {teachSkills.map((skill) => (
                  <span
                    key={skill}
                    className="skill-badge-teach inline-flex items-center h-6 text-xs px-2.5 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Connector - centered bidirectional symbol */}
            <motion.div
              variants={fadeIn}
              className="flex items-center justify-center py-4 md:py-0"
            >
              <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                <div className="hidden md:block w-px h-8 bg-border" />
                <div className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="hidden md:block w-px h-8 bg-border" />
              </div>
            </motion.div>

            {/* I Want to Learn */}
            <motion.div
              variants={fadeUp}
              className="rounded-lg border p-6 sm:p-7"
              style={{
                background: "hsl(var(--learn-bg))",
                borderColor: "hsl(var(--learn-border))",
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <Compass
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "hsl(var(--learn-text))" }}
                />
                <div>
                  <p
                    className="text-[11px] font-semibold tracking-[0.1em] uppercase leading-none mb-0.5"
                    style={{ color: "hsl(var(--learn-text))" }}
                  >
                    I Want to Learn
                  </p>
                  <p className="text-xs text-muted-foreground">Skills I want from others</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {learnSkills.map((skill) => (
                  <span
                    key={skill}
                    className="skill-badge-learn inline-flex items-center h-6 text-xs px-2.5 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-center text-xs text-muted-foreground mt-8"
          >
            You're not locked into one role - teach what you know, learn what you don't.
          </motion.p>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.28 }}
          className="mb-14"
        >
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-3">
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] max-w-xs">
            Three steps to your next exchange.
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid sm:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              variants={fadeUp}
              className="bg-background p-8 flex flex-col"
            >
              {/* Step number */}
              <span className="text-[44px] font-bold leading-none text-border/80 mb-6 select-none tabular-nums">
                {step.num}
              </span>

              <h3 className="text-base font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── 5. SKILLS STRIP ───────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/20">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.28 }}
            className="mb-10"
          >
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-3">
              What people share
            </p>
            <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.02em]">
              Find people through what they know.
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid sm:grid-cols-2 gap-8"
          >
            {/* Teaching */}
            <motion.div variants={fadeUp}>
              <p
                className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-3"
                style={{ color: "hsl(var(--teach-text))" }}
              >
                People are teaching
              </p>
              <div className="flex flex-wrap gap-2">
                {[...teachSkills, "Figma", "TypeScript", "Yoga", "Statistics"].map((skill) => (
                  <button
                    key={skill}
                    onClick={() => navigate("/signup")}
                    className="skill-badge-teach inline-flex items-center h-6 text-xs px-2.5 font-medium hover:opacity-75 transition-opacity"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Learning */}
            <motion.div variants={fadeUp}>
              <p
                className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-3"
                style={{ color: "hsl(var(--learn-text))" }}
              >
                People want to learn
              </p>
              <div className="flex flex-wrap gap-2">
                {[...learnSkills, "Cooking", "Cinematography", "Arabic", "Negotiation"].map((skill) => (
                  <button
                    key={skill}
                    onClick={() => navigate("/signup")}
                    className="skill-badge-learn inline-flex items-center h-6 text-xs px-2.5 font-medium hover:opacity-75 transition-opacity"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 6. PEOPLE DISCOVERY ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.28 }}
          >
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">
              How people connect
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-4">
              Meet people through what they know.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm">
              On SkillShare, skills are how you introduce yourself.
              What you can teach tells people who you are.
              What you want to learn tells people what you're looking for.
            </p>

            <ul className="space-y-3.5">
              {[
                { icon: BookOpen,       text: "Browse what others can teach" },
                { icon: Users,          text: "Find someone whose skills match what you need" },
                { icon: ArrowLeftRight, text: "Offer something in return - or just connect" },
                { icon: MessageSquare,  text: "Chat, agree on a time, and exchange knowledge" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-foreground">
                  <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  {item.text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Profile card - peer, not mentor */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35 }}
            className="rounded-lg border border-border bg-card shadow-xs p-6 max-w-sm md:ml-auto"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                IB
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Irusha Bandara</p>
                <p className="text-xs text-muted-foreground">Engineering Student</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Can teach */}
              <div>
                <p
                  className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-2"
                  style={{ color: "hsl(var(--teach-text))" }}
                >
                  I can teach
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Python", "Machine Learning", "Data Structures", "Calculus", "React"].map((s) => (
                    <span key={s} className="skill-badge-teach inline-flex items-center h-5 text-[11px] px-2 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Wants to learn */}
              <div>
                <p
                  className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-2"
                  style={{ color: "hsl(var(--learn-text))" }}
                >
                  I want to learn
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Photography", "Digital Marketing", "Piano", "Spanish", "Finance", "Video Editing"].map((s) => (
                    <span key={s} className="skill-badge-learn inline-flex items-center h-5 text-[11px] px-2 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1"
                onClick={() => navigate("/signup")}
              >
                Connect with Irusha
              </Button>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ── 7. FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.28 }}
          className="max-w-6xl mx-auto px-6 py-24"
        >
          <div className="max-w-lg">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.025em] mb-4 leading-[1.1]">
              Have something<br />to share?
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              Someone out there may be looking for exactly what you know.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="gap-2 px-8"
                onClick={() => navigate("/signup", { state: { tab: "signup" } })}
              >
                Get started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore skills
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 8. FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 select-none">
            <img src="/skillshare.png" alt="SkillShare Logo" className="w-5 h-5 object-contain flex-shrink-0" />
            <span className="text-sm font-semibold">
              <span className="text-foreground">Skill</span>
              <span className="text-primary">Share</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 SkillShare. Built for students, by students.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
