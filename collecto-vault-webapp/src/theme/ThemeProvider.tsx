import React, { createContext, useContext, useEffect, useState } from "react";
import { type Theme, defaultTheme, themes } from "./themes";
import "./theme.css";

type ThemeContextValue = {
  theme: Theme;
  setThemeByName: (name: string) => void;
  updateTheme: (patch: Partial<Theme>) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyCssVars(theme: Theme) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty("--color-primary", c.primary);
  root.style.setProperty("--color-primary-text", c.primaryText);
  root.style.setProperty("--color-secondary", c.secondary);
  root.style.setProperty("--color-background", c.background);
  root.style.setProperty("--color-surface", c.surface);
  root.style.setProperty("--color-text", c.text);
  root.style.setProperty("--color-border", c.border);
  root.style.setProperty("--color-danger", c.danger);
  if (theme.headerGradient) root.style.setProperty("--header-gradient", theme.headerGradient);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode; initial?: string }> = ({
  children,
  initial,
}) => {
  const stored = typeof window !== "undefined" ? localStorage.getItem("collectovault:theme") : null;
  const initialName = initial || stored || defaultTheme.name;
  const [theme, setTheme] = useState<Theme>(themes[initialName] ?? defaultTheme);

  useEffect(() => {
    applyCssVars(theme);
    try { localStorage.setItem("collectovault:theme", theme.name); } catch {}
  }, [theme]);

  const setThemeByName = (name: string) => {
    const t = themes[name] ?? theme;
    setTheme(t);
  };

  const updateTheme = (patch: Partial<Theme>) => {
    const merged = { ...theme, ...patch } as Theme;
    setTheme(merged);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeByName, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export default ThemeProvider;
