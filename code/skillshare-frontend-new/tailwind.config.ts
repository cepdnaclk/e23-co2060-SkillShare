import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Single modern sans-serif for the entire product
        sans:    ["Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        body:    ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:            "hsl(var(--sidebar-background))",
          foreground:         "hsl(var(--sidebar-foreground))",
          primary:            "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:             "hsl(var(--sidebar-accent))",
          "accent-foreground":"hsl(var(--sidebar-accent-foreground))",
          border:             "hsl(var(--sidebar-border))",
          ring:               "hsl(var(--sidebar-ring))",
        },
        // Teach ↔ Learn semantic colors
        teach: {
          bg:     "hsl(var(--teach-bg))",
          border: "hsl(var(--teach-border))",
          text:   "hsl(var(--teach-text))",
        },
        learn: {
          bg:     "hsl(var(--learn-bg))",
          border: "hsl(var(--learn-border))",
          text:   "hsl(var(--learn-text))",
        },
      },
      borderRadius: {
        // Hierarchy in border radius:
        // pill   → skill tags, status badges, availability indicators (9999px)
        // xl     → hero sections (20px)
        // lg     → modals, large panels (16px)
        // DEFAULT → cards, containers (12px)
        // md     → inputs, buttons (8px)
        // sm     → small chips, tight elements (6px)
        pill:  "var(--radius-pill)",
        xl:    "var(--radius-xl)",
        lg:    "var(--radius-lg)",
        DEFAULT:"var(--radius)",
        md:    "var(--radius-sm)",
        sm:    "calc(var(--radius-sm) - 2px)",
      },
      boxShadow: {
        // Clean shadow scale — no glow, no color-tinted shadows
        xs:       "var(--shadow-xs)",
        sm:       "var(--shadow-sm)",
        md:       "var(--shadow-md)",
        lg:       "var(--shadow-lg)",
        xl:       "var(--shadow-xl)",
        // Legacy aliases
        card:     "var(--shadow-sm)",
        elevated: "var(--shadow-md)",
      },
      keyframes: {
        // UI interaction animations
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        // Subtle entrance animation
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        // Skeleton loading shimmer (functional)
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-up":        "fade-up 0.25s ease-out both",
        // NOTE: animate-float and animate-pulse-glow have been removed
        // as they were purely decorative. If motion is needed, use
        // Framer Motion directly with appropriate reduced-motion handling.
      },
      letterSpacing: {
        heading: "-0.02em",
        tight:   "-0.01em",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
