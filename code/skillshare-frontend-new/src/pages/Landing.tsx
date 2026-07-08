import { motion } from "framer-motion";
import { ArrowRight, Users, Clock, MapPin, BookOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ─── Spring preset ──────────────────────────────────────── */
const spring = { type: "spring" as const, stiffness: 280, damping: 28, mass: 1 };

/* ─── Ambient orbs for the public landing page ───────────── */
const LandingOrbs = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
    <div
      className="absolute -top-[15%] left-[5%] w-[750px] h-[750px] rounded-full animate-drift-slow"
      style={{ background: "radial-gradient(circle, rgba(124,58,237,0.32) 0%, transparent 65%)", filter: "blur(100px)" }}
    />
    <div
      className="absolute bottom-[0%] right-[0%] w-[600px] h-[600px] rounded-full animate-drift-medium"
      style={{ background: "radial-gradient(circle, rgba(192,38,211,0.24) 0%, transparent 65%)", filter: "blur(110px)" }}
    />
    <div
      className="absolute top-[50%] left-[55%] w-[400px] h-[400px] rounded-full animate-drift-fast"
      style={{ background: "radial-gradient(circle, rgba(251,146,60,0.18) 0%, transparent 65%)", filter: "blur(120px)" }}
    />
  </div>
);

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0C] relative overflow-x-hidden">
      <LandingOrbs />

      {/* ── Glass Header ──────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50
        bg-black/40 backdrop-blur-2xl border-b border-white/8
        supports-[backdrop-filter]:bg-black/25">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-heading font-bold text-xl text-white/90">
            Skill<span className="gradient-text">Share</span>
          </h1>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}
              onClick={() => navigate("/signup", { state: { tab: "signin" } })}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white/55 hover:text-white/90 hover:bg-white/8 transition-colors"
            >
              Log In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}
              onClick={() => navigate("/signup", { state: { tab: "signup" } })}
              className="px-5 py-2 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-violet-500 to-fuchsia-500
                text-white shadow-lg shadow-violet-500/30
                hover:from-violet-400 hover:to-fuchsia-400 transition-all"
            >
              Sign Up
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20 z-10">
        <div className="absolute inset-0 dot-grid opacity-20" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                bg-white/8 border border-white/12 text-white/70 text-sm font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                For University Students
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.08 }}
              className="text-5xl md:text-7xl font-heading font-bold leading-[1.08] mb-6 text-white"
            >
              Share skills,
              <br />
              <span className="gradient-text">find your match.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.14 }}
              className="text-lg md:text-xl text-white/50 mb-10 max-w-xl leading-relaxed"
            >
              Connect with fellow students who share your interests. Match schedules,
              exchange knowledge, and grow together on campus.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}
                onClick={() => navigate("/signup")}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold
                  bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white
                  shadow-xl shadow-violet-500/35 hover:shadow-violet-500/50
                  hover:from-violet-400 hover:to-fuchsia-400 transition-all"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-4 rounded-2xl text-base font-semibold
                  bg-white/6 hover:bg-white/12 border border-white/12 hover:border-white/22
                  text-white/70 hover:text-white backdrop-blur-sm transition-all"
              >
                Learn More
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section id="how-it-works" className="relative py-24 z-10">
        {/* Subtle section separator */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={spring}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">How It Works</h2>
            <p className="text-white/45 max-w-md mx-auto">
              Three simple steps to find your perfect study partner
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users,    title: "Create Your Profile", desc: "Add your skills, interests, and what you want to learn from others." },
              { icon: Clock,    title: "Set Your Schedule",   desc: "Mark your free time slots so we can find overlapping availability." },
              { icon: Sparkles, title: "Get Matched",         desc: "We'll connect you with students who match your skills and schedule." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...spring, delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                className="p-8 rounded-3xl text-center
                  bg-white/5 backdrop-blur-xl border border-white/10
                  hover:bg-white/8 hover:border-white/18
                  shadow-xl shadow-black/20 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-xl font-heading font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── More Features ─────────────────────────────────── */}
      <section className="relative py-24 z-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={spring}
                className="text-3xl md:text-4xl font-heading font-bold text-white mb-6"
              >
                Everything you need to
                <br />
                <span className="gradient-text">collaborate effectively</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ ...spring, delay: 0.06 }}
                className="text-white/45 mb-8 leading-relaxed"
              >
                Built specifically for university students who want to learn from
                each other and make the most of their campus experience.
              </motion.p>

              <div className="space-y-3">
                {[
                  { icon: BookOpen, label: "Add your class schedule" },
                  { icon: MapPin,   label: "Share meeting locations" },
                  { icon: Clock,    label: "Find common free time" },
                  { icon: Users,    label: "Connect with peers" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...spring, delay: 0.1 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="font-medium text-white/70">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mock app glass card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={spring}
              className="relative"
            >
              <div className="aspect-square rounded-3xl
                bg-gradient-to-br from-violet-600/12 to-fuchsia-600/8
                border border-white/10 p-8 flex items-center justify-center">
                <div className="w-full h-full rounded-2xl
                  bg-white/[0.04] backdrop-blur-xl border border-white/10
                  shadow-2xl shadow-black/40 p-6">
                  <div className="space-y-4">
                    <div className="h-4 w-24 bg-white/8 rounded-lg" />
                    <div className="h-10 w-full bg-white/5 border border-white/8 rounded-xl" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-violet-500/15 border border-violet-500/20 rounded-full" />
                      <div className="h-6 w-20 bg-violet-500/15 border border-violet-500/20 rounded-full" />
                      <div className="h-6 w-14 bg-violet-500/15 border border-violet-500/20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-7 gap-1 mt-6">
                      {Array.from({ length: 35 }).map((_, i) => (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg ${
                            [5, 12, 19, 26, 27].includes(i)
                              ? "bg-violet-500/30 border border-violet-500/40"
                              : "bg-white/[0.04] border border-white/6"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────── */}
      <section className="relative py-28 z-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* CTA glass card */}
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={spring}
            className="max-w-2xl mx-auto text-center p-12 rounded-3xl
              bg-white/[0.04] backdrop-blur-2xl border border-white/10
              shadow-2xl shadow-black/30"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
              Ready to find your study partners?
            </h2>
            <p className="text-white/45 mb-8 max-w-md mx-auto leading-relaxed">
              Join thousands of students already connecting and learning from each other.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold
                bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white
                shadow-xl shadow-violet-500/35 hover:shadow-violet-500/50
                hover:from-violet-400 hover:to-fuchsia-400 transition-all"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="relative py-12 z-10 border-t border-white/8">
        <div className="container mx-auto px-6 text-center text-sm text-white/25">
          <p>© 2026 SkillShare. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
