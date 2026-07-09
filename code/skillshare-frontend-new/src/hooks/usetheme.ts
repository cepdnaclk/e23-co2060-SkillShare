import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "skillshare-theme";

// Requires Tailwind configured with `darkMode: "class"` in tailwind.config —
// this hook toggles the `dark` class on <html>, which your existing
// dark-mode CSS variables (bg-background, bg-card, etc.) already respond to.
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (mode: ThemeMode) => {
      const isDark =
        mode === "dark" ||
        (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", isDark);
    };

    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme("system");
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [theme]);

  return { theme, setTheme: setThemeState };
}