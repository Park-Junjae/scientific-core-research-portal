"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Preferences = {
  density: "Comfortable" | "Compact";
  pdf: "Inline viewer" | "New tab";
  theme: "System" | "Light" | "Dark";
  recent: number;
};

export const defaultPreferences: Preferences = {
  density: "Comfortable",
  pdf: "Inline viewer",
  theme: "System",
  recent: 5,
};

type PreferencesContextValue = {
  preferences: Preferences;
  updatePreference: <Key extends keyof Preferences>(key: Key, value: Preferences[Key]) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const storageKey = "scientific-core-preferences";

function normalizePreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object") return defaultPreferences;
  const candidate = value as Partial<Preferences>;
  return {
    density: candidate.density === "Compact" ? "Compact" : "Comfortable",
    pdf: candidate.pdf === "New tab" ? "New tab" : "Inline viewer",
    theme: candidate.theme === "Light" || candidate.theme === "Dark" ? candidate.theme : "System",
    recent: Math.min(10, Math.max(3, Number(candidate.recent) || 5)),
  };
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setPreferences(normalizePreferences(JSON.parse(localStorage.getItem(storageKey) ?? "null")));
      } catch {
        localStorage.removeItem(storageKey);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = preferences.density.toLowerCase();
    if (preferences.theme === "System") delete root.dataset.theme;
    else root.dataset.theme = preferences.theme.toLowerCase();
  }, [preferences.density, preferences.theme]);

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    updatePreference: (key, next) => {
      setPreferences((current) => {
        const merged = normalizePreferences({ ...current, [key]: next });
        localStorage.setItem(storageKey, JSON.stringify(merged));
        return merged;
      });
    },
  }), [preferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}
