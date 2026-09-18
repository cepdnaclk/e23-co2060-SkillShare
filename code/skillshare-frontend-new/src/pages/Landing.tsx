import { motion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  Sun,
  Moon,
  BookOpen,
  Compass,
  Users,
  ArrowLeftRight,
  MessageSquare,
  PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

/* ─── Animation variants ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
};



/* ─── How It Works steps ─────────────────────────────────────────────────── */
const steps = [
  {
    num: "01",
    title: "Share",
    desc: "Tell people what you can teach — any skill, any level.",
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* ── 1. NAVIGATION ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 font-bold text-lg select-none focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="tracking-tight">
              <span className="text-foreground">Skill</span>
              <span className="text-primary">Share</span>
            </span>
          </button>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <button onClick={() => document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors">Explore</button>
            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors">How it works</button>
            <button className="hover:text-primary transition-colors">About</button>
          </nav>

          {/* Right nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground font-medium rounded-full px-5"
                onClick={() => navigate("/signup", { state: { tab: "signin" } })}
              >
                Log in
              </Button>

              <Button
                className="font-medium rounded-full px-6 shadow-sm"
                onClick={() => navigate("/signup", { state: { tab: "signup" } })}
              >
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. HERO ───────────────────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 lg:pt-32 lg:pb-28">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]"
          >
            Learn. Teach.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">
              Grow Together.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A peer-to-peer skill sharing platform for university students. Share what you know. Learn what you love.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="gap-2 px-8 h-12 rounded-full text-base font-medium shadow-md shadow-primary/20 w-full sm:w-auto"
              onClick={() => navigate("/signup", { state: { tab: "signup" } })}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 px-8 h-12 rounded-full text-base font-medium w-full sm:w-auto hover:bg-secondary/50"
              onClick={() => {}}
            >
              <PlayCircle className="w-5 h-5 text-primary" /> Watch Video
            </Button>
          </motion.div>
        </motion.div>
      </section>



      {/* ── 3. TEACH ↔ LEARN ─────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.28 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Every person is both a teacher and a learner
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Share what you know and discover what you want to learn. You're not locked into one role.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-center"
          >
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">I Can Teach</h3>
                  <p className="text-sm text-muted-foreground">Skills I share with others</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Python", "Guitar"].map((skill) => (
                  <span
                    key={skill}
                    className="skill-badge-teach inline-flex items-center h-7 text-xs px-3 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="hidden md:flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shadow-sm">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-violet-500/10 rounded-xl">
                  <Compass className="w-6 h-6 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">I Want to Learn</h3>
                  <p className="text-sm text-muted-foreground">Skills I want from others</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Video Editing", "Spanish"].map((skill) => (
                  <span
                    key={skill}
                    className="skill-badge-learn inline-flex items-center h-7 text-xs px-3 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.28 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Three steps to your next exchange
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Getting started is easy. Build your profile and start connecting.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className="bg-card rounded-2xl p-8 border shadow-sm relative overflow-hidden"
              >
                <div className="text-[100px] font-black absolute -top-10 -right-6 text-muted/20 select-none pointer-events-none">
                  {step.num}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-lg mb-6">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* ── 6. PEOPLE DISCOVERY ────────────────────────────────────────── */}
      <section className="py-24 bg-secondary/20">
        <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.28 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Meet people through what they know.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                On SkillShare, skills are how you introduce yourself. What you can teach tells people who you are. What you want to learn tells people what you're looking for.
              </p>

              <ul className="space-y-4 max-w-lg mx-auto text-left">
                {[
                  { icon: BookOpen,       text: "Browse what others can teach" },
                  { icon: Users,          text: "Find someone whose skills match what you need" },
                  { icon: ArrowLeftRight, text: "Offer something in return — or just connect" },
                  { icon: MessageSquare,  text: "Chat, agree on a time, and exchange knowledge" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-base font-medium">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </motion.div>
        </div>
      </section>

      {/* ── 7. FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.28 }}
          className="max-w-4xl mx-auto px-6 text-center relative z-10"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Ready to share your skills?
          </h2>
          <p className="text-xl text-primary-foreground/80 leading-relaxed mb-10 max-w-2xl mx-auto">
            Join our community of university students learning from each other every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 px-10 h-14 rounded-full text-lg font-semibold text-primary hover:bg-white shadow-lg"
              onClick={() => navigate("/signup", { state: { tab: "signup" } })}
            >
              Get started for free <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── 8. FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 select-none">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-foreground">Skill</span>
              <span className="text-primary">Share</span>
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            © {new Date().getFullYear()} SkillShare. Built for students, by students.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
