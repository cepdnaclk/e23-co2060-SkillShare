import { motion } from "framer-motion";
import { ArrowRight, Users, Clock, MapPin, BookOpen, Sparkles, GraduationCap, Sun, Moon, Code2, Palette, Mic, BarChart3, PenLine, Music2, Camera, Video, Megaphone, Calculator, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const Landing = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-heading font-bold text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            Skill<span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">Share</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>
            <Button variant="ghost" onClick={() => navigate("/signup", { state: { tab: "signin" } })}>
              Log In
            </Button>
            <Button onClick={() => navigate("/signup", { state: { tab: "signup" } })} className="gap-2 bg-gradient-to-r from-violet-500 to-orange-400 hover:opacity-90 text-white border-0">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative container mx-auto px-6 pt-20 pb-28 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-orange-400 text-white text-xs font-semibold mb-6 shadow-lg shadow-violet-500/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            For University Students
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-heading font-bold leading-tight mb-5">
            Share skills,<br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">find your match.</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-lg mx-auto">
            Connect with fellow students who share your interests. Match schedules,
            exchange knowledge, and grow together on campus.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate("/signup")}
              className="text-base px-8 py-6 rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-orange-400 hover:opacity-90 text-white border-0 shadow-lg shadow-violet-500/30"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="text-base px-8 py-6 rounded-xl border-2 border-violet-500/40 text-foreground hover:bg-violet-500/10"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* purple + orange layered glow behind hero */}
        <div className="absolute inset-x-0 top-0 -z-0 flex justify-center">
          <div className="w-[560px] h-[560px] rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-orange-400/30 blur-3xl" />
        </div>
        <div className="absolute -left-16 top-32 -z-0 w-[260px] h-[260px] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -right-16 top-8 -z-0 w-[260px] h-[260px] rounded-full bg-orange-400/20 blur-3xl" />
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-heading font-bold mb-2">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps to find your perfect study partner</p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-3 gap-6"
        >
          {[
            { icon: Users, title: "Create Your Profile", desc: "Add your skills, interests, and what you want to learn from others.", grad: "from-violet-500 to-purple-600", ring: "hover:border-violet-500/50" },
            { icon: Clock, title: "Set Your Schedule", desc: "Mark your free time slots so we can find overlapping availability.", grad: "from-amber-500 to-orange-500", ring: "hover:border-amber-500/50" },
            { icon: Sparkles, title: "Get Matched", desc: "We'll connect you with students who match your skills and schedule.", grad: "from-fuchsia-500 to-orange-400", ring: "hover:border-fuchsia-500/50" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className={`p-6 rounded-2xl bg-card border-2 border-border text-center transition-colors ${feature.ring}`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.grad} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* More Features */}
      <section className="border-y border-border bg-gradient-to-br from-violet-500/5 via-background to-orange-400/5">
        <div className="container mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <h2 className="text-3xl font-heading font-bold mb-4">
              Everything you need to<br />
              <span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">collaborate effectively</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Built specifically for university students who want to learn from
              each other and make the most of their campus experience.
            </p>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-4">
              {[
                { icon: BookOpen, label: "Add your class schedule", grad: "from-purple-500 to-violet-500" },
                { icon: MapPin, label: "Share meeting locations", grad: "from-fuchsia-500 to-pink-500" },
                { icon: Clock, label: "Find common free time", grad: "from-amber-500 to-orange-500" },
                { icon: Users, label: "Connect with peers", grad: "from-violet-500 to-fuchsia-500" },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center shrink-0 shadow-md`}>
                    <item.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Skill match grid visual */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="p-6 rounded-2xl bg-card border-2 border-violet-500/30 shadow-xl shadow-violet-500/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">Live skill matches</span>
            </div>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-6 gap-2"
            >
              {[
                { icon: Code2,      bg: "bg-violet-500" },
                { icon: Palette,    bg: "bg-orange-500" },
                { icon: Mic,        bg: "bg-fuchsia-500" },
                { icon: BarChart3,  bg: "bg-amber-500" },
                { icon: PenLine,    bg: "bg-purple-500" },
                { icon: Music2,     bg: "bg-violet-600" },
                { icon: Camera,     bg: "bg-orange-400" },
                { icon: Video,      bg: "bg-fuchsia-400" },
                { icon: Megaphone,  bg: "bg-amber-400" },
                { icon: Calculator, bg: "bg-purple-600" },
                { icon: BookOpen,   bg: "bg-violet-400" },
                { icon: MapPin,     bg: "bg-orange-600" },
                { icon: Users,      bg: "bg-fuchsia-600" },
                { icon: Sparkles,   bg: "bg-amber-600" },
                { icon: GraduationCap, bg: "bg-purple-400" },
                { icon: Clock,      bg: "bg-violet-500" },
                { icon: Code2,      bg: "bg-orange-500" },
                { icon: Palette,    bg: "bg-fuchsia-500" },
                { icon: Mic,        bg: "bg-amber-500" },
                { icon: BarChart3,  bg: "bg-purple-500" },
                { icon: PenLine,    bg: "bg-violet-600" },
                { icon: Music2,     bg: "bg-orange-400" },
                { icon: Camera,     bg: "bg-fuchsia-400" },
                { icon: Video,      bg: "bg-amber-400" },
                { icon: Megaphone,  bg: "bg-purple-600" },
                { icon: Calculator, bg: "bg-violet-400" },
                { icon: BookOpen,   bg: "bg-orange-600" },
                { icon: MapPin,     bg: "bg-fuchsia-600" },
                { icon: Users,      bg: "bg-amber-600" },
                { icon: Sparkles,   bg: "bg-purple-400" },
              ].map((skill, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, scale: 0.7 },
                    show: { opacity: 1, scale: 1 },
                  }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ y: -2, scale: 1.05 }}
                  className={`relative aspect-square rounded-xl ${skill.bg} flex items-center justify-center`}
                >
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-card flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                  </div>
                  <skill.icon className="w-4 h-4 text-white" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="relative rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 py-16 px-6 overflow-hidden"
        >
          <h2 className="text-3xl font-heading font-bold mb-3 text-white">Ready to find your study partners?</h2>
          <p className="text-white/90 mb-8">
            Join thousands of students already connecting and learning from each other.
          </p>
          <Button
            onClick={() => navigate("/signup")}
            className="text-base px-8 py-6 rounded-xl gap-2 bg-white text-violet-600 hover:bg-white/90 border-0 shadow-lg font-semibold"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">© 2026 SkillShare. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
