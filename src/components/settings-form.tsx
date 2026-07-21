"use client";

import { useState } from "react";
import { usePreferences, type Preferences } from "@/lib/preferences";

export function SettingsForm() {
  const { preferences: value, updatePreference } = usePreferences();
  const [saved, setSaved] = useState(false);
  const update = <Key extends keyof Preferences>(key: Key, next: Preferences[Key]) => { updatePreference(key, next); setSaved(true); setTimeout(() => setSaved(false), 1200); };
  const choices: Array<{ key: keyof Preferences; label: string; values: string[] }> = [
    { key: "language", label: "Default language", values: ["English", "Korean"] },
    { key: "view", label: "Runs display", values: ["List", "Grid"] },
    { key: "density", label: "Reading density", values: ["Comfortable", "Compact"] },
    { key: "pdf", label: "PDF opening", values: ["Inline viewer", "New tab"] },
    { key: "theme", label: "Theme", values: ["System", "Light", "Dark"] },
  ];
  return <div className="settings-panel">{choices.map((choice) => <div className="setting-row" key={choice.key}><div><strong>{choice.label}</strong><p>Stored only in this browser and applied immediately.</p></div><select value={String(value[choice.key])} onChange={(event) => update(choice.key, event.target.value as never)}>{choice.values.map((item) => <option key={item}>{item}</option>)}</select></div>)}<div className="setting-row"><div><strong>Recent-run limit</strong><p>Number of recent runs shown in the sidebar.</p></div><input aria-label="Recent-run limit" type="number" min={3} max={10} value={value.recent} onChange={(event) => update("recent", Number(event.target.value))} /></div><p className="save-status" aria-live="polite">{saved ? "Preferences saved and applied." : "No account or server storage is used."}</p></div>;
}
