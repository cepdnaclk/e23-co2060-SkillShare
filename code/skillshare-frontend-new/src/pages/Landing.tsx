import { motion } from "framer-motion";
import { ArrowRight, Users, Clock, MapPin, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-heading font-bold text-xl">
            Skill<span className="text-primary">Share</span>
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/signup")}>
              Log In
            </Button>
            <Button onClick={() => navigate("/signup")}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                For University Students
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl font-heading font-bold leading-tight mb-6"
            >
              Share skills,
              <br />
              <span className="text-primary">find your match.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl"
            >
              Connect with fellow students who share your interests. Match schedules,
              exchange knowledge, and grow together on campus.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Button size="lg" onClick={() => navigate("/signup")} className="text-base px-8 py-6 rounded-xl gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-xl">
                Learn More
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-40 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
      </section>

      {/* Features */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Three simple steps to find your perfect study partner
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Create Your Profile",
                desc: "Add your skills, interests, and what you want to learn from others.",
              },
              {
                icon: Clock,
                title: "Set Your Schedule",
                desc: "Mark your free time slots so we can find overlapping availability.",
              },
              {
                icon: Sparkles,
                title: "Get Matched",
                desc: "We'll connect you with students who match your skills and schedule.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-card border border-border shadow-card text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* More Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-heading font-bold mb-6"
              >
                Everything you need to
                <br />
                <span className="text-primary">collaborate effectively</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground mb-8"
              >
                Built specifically for university students who want to learn from
                each other and make the most of their campus experience.
              </motion.p>

              <div className="space-y-4">
                {[
                  { icon: BookOpen, label: "Add your class schedule" },
                  { icon: MapPin, label: "Share meeting locations" },
                  { icon: Clock, label: "Find common free time" },
                  { icon: Users, label: "Connect with peers" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-card border border-border shadow-elevated p-6">
                  <div className="space-y-4">
                    <div className="h-4 w-24 bg-secondary rounded" />
                    <div className="h-10 w-full bg-secondary rounded-lg" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-primary/20 rounded-full" />
                      <div className="h-6 w-20 bg-primary/20 rounded-full" />
                      <div className="h-6 w-14 bg-primary/20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-7 gap-1 mt-6">
                      {Array.from({ length: 35 }).map((_, i) => (
                        <div
                          key={i}
                          className={`aspect-square rounded ${
                            [5, 12, 19, 26, 27].includes(i)
                              ? "bg-primary/30"
                              : "bg-secondary/50"
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

      {/* CTA */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-heading font-bold mb-6"
          >
            Ready to find your study partners?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-primary-foreground/80 mb-8 max-w-md mx-auto"
          >
            Join thousands of students already connecting and learning from each other.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/signup")}
              className="text-base px-8 py-6 rounded-xl gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2026 SkillShare. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
