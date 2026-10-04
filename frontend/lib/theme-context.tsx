"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeType =
  | "classic-dark"
  | "classic-light"
  | "cherry-blossom"
  | "aqua-noir"
  | "crimson-depths"
  | "midnight-violet";

export interface ThemeOption {
  id: ThemeType;
  name: string;
  dotColor: string;
  bgColor: string;
  isLight?: boolean;
}

export const THEMES: ThemeOption[] = [
  { id: "classic-dark", name: "Classic Dark", dotColor: "#14B8A6", bgColor: "#070C18" },
  { id: "classic-light", name: "Classic Light", dotColor: "#0D9488", bgColor: "#FFFFFF", isLight: true },
  { id: "cherry-blossom", name: "Cherry Blossom", dotColor: "#D6336C", bgColor: "#FFF0F5", isLight: true },
  { id: "aqua-noir", name: "Aqua Noir", dotColor: "#00D9FF", bgColor: "#0A0A0A" },
  { id: "crimson-depths", name: "Crimson Depths", dotColor: "#E8384F", bgColor: "#0B1120" },
  { id: "midnight-violet", name: "Midnight Violet", dotColor: "#A855F7", bgColor: "#0F0A1F" },
];

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "classic-dark",
  setTheme: () => {},
  themes: THEMES,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>("classic-dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pricepilot_theme") as ThemeType;
    if (saved && THEMES.some((t) => t.id === saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "classic-dark");
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem("pricepilot_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
