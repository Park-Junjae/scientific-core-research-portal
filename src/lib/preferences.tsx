"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Preferences = {
  density: "Comfortable" | "Compact";
  pdf: "Inline viewer" | "New tab";
  theme: "System" | "Light" | "Dark";
  recent: number;
  /* Composer defaults. Applied to a new run request while the form is still
     untouched, so they seed a run rather than override what was typed. */
  defaultMode: "STANDARD" | "BREAKTHROUGH_DISCOVERY";
  defaultReportLanguage: "" | "ko" | "en" | "bilingual";
  defaultLiteratureScope: boolean;
  /* Which My Research tab opens first. */
  defaultResearchView: "active" | "completed" | "archived";
};

export const defaultPreferences: Preferences = {
  density: "Comfortable",
  pdf: "Inline viewer",
  theme: "System",
  recent: 5,
  defaultMode: "STANDARD",
  defaultReportLanguage: "",
  defaultLiteratureScope: true,
  defaultResearchView: "active",
};

type PreferencesContextValue = {
  preferences: Preferences;
  /* False until localStorage has been read. Consumers that seed their own state
     from a preference must wait for this, or they would seed from the defaults
     on the first paint and never correct themselves. */
  loaded: boolean;
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
    defaultMode:
      candidate.defaultMode === "BREAKTHROUGH_DISCOVERY" ? "BREAKTHROUGH_DISCOVERY" : "STANDARD",
    defaultReportLanguage:
      candidate.defaultReportLanguage === "ko"
        || candidate.defaultReportLanguage === "en"
        || candidate.defaultReportLanguage === "bilingual"
        ? candidate.defaultReportLanguage
        : "",
    defaultLiteratureScope: candidate.defaultLiteratureScope !== false,
    defaultResearchView:
      candidate.defaultResearchView === "completed" || candidate.defaultResearchView === "archived"
        ? candidate.defaultResearchView
        : "active",
  };
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setPreferences(normalizePreferences(JSON.parse(localStorage.getItem(storageKey) ?? "null")));
      } catch {
        localStorage.removeItem(storageKey);
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = preferences.density.toLowerCase();
    /* Absent means "System", which lets the prefers-color-scheme rule apply.
       An explicit choice must be written out so it can win over the OS. */
    if (preferences.theme === "System") delete root.dataset.theme;
    else root.dataset.theme = preferences.theme.toLowerCase();
  }, [preferences.density, preferences.theme]);

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    loaded,
    updatePreference: (key, next) => {
      setPreferences((current) => {
        const merged = normalizePreferences({ ...current, [key]: next });
        localStorage.setItem(storageKey, JSON.stringify(merged));
        return merged;
      });
    },
  }), [preferences, loaded]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}
