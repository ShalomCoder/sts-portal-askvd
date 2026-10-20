"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const KEY = "sts_theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme) || "system";
    setThemeState(stored);
    apply(stored);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply(stored === "system" ? "system" : stored);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const apply = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      setResolved("dark");
    } else if (t === "light") {
      root.classList.remove("dark");
      setResolved("light");
    } else {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", dark);
      setResolved(dark ? "dark" : "light");
    }
  };

  const setTheme = (t: Theme) => {
    localStorage.setItem(KEY, t);
    setThemeState(t);
    apply(t);
  };

  return { theme, setTheme, resolved };
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const opts: Theme[] = ["light", "dark", "system"];
  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className="rounded-full border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700"
    >
      {opts.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
