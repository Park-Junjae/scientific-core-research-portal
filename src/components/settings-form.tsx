"use client";

import { useEffect, useState } from "react";

type Preferences = { language: string; view: string; density: string; pdf: string; theme: string; recent: number };
const defaults: Preferences = { language: "English", view: "List", density: "Comfortable", pdf: "Inline viewer", theme: "System", recent: 5 };

export function SettingsForm() {
  const [value, setValue] = useState(defaults);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("scientific-core-preferences");
    const timer = window.setTimeout(() => {
      if (stored) setValue(JSON.parse(stored) as Preferences);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const update = (key: keyof Preferences, next: string | number) => { const merged = { ...value, [key]: next }; setValue(merged); localStorage.setItem("scientific-core-preferences", JSON.stringify(merged)); setSaved(true); setTimeout(() => setSaved(false), 1200); };
  const choices: Array<{ key: keyof Preferences; label: string; values: string[] }> = [
    { key: "language", label: "Default language", values: ["English", "Korean"] },
    { key: "view", label: "Runs display", values: ["List", "Grid"] },
    { key: "density", label: "Reading density", values: ["Comfortable", "Compact"] },
    { key: "pdf", label: "PDF opening", values: ["Inline viewer", "New tab"] },
    { key: "theme", label: "Theme", values: ["System", "Light", "Dark"] },
  ];
  return <div className="settings-panel">{choices.map((choice) => <div className="setting-row" key={choice.key}><div><strong>{choice.label}</strong><p>Stored only in this browser.</p></div><select value={String(value[choice.key])} onChange={(event) => update(choice.key, event.target.value)}>{choice.values.map((item) => <option key={item}>{item}</option>)}</select></div>)}<div className="setting-row"><div><strong>Recent-run limit</strong><p>Number of recent runs shown in the sidebar.</p></div><input aria-label="Recent-run limit" type="number" min={3} max={10} value={value.recent} onChange={(event) => update("recent", Number(event.target.value))} /></div><p className="save-status" aria-live="polite">{saved ? "Preferences saved locally." : "No account or server storage is used."}</p></div>;
}
