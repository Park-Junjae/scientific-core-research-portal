"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale";
import { usePreferences, type Preferences } from "@/lib/preferences";

export function SettingsForm() {
  const { locale } = useLocale();
  const { preferences: value, updatePreference } = usePreferences();
  const [saved, setSaved] = useState(false);
  const markSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 1200); };
  const update = <Key extends keyof Preferences>(key: Key, next: Preferences[Key]) => { updatePreference(key, next); markSaved(); };
  return <div className="settings-panel">
    <div className="setting-row"><div><strong>{locale === "ko" ? "읽기 밀도" : "Reading density"}</strong></div><select value={value.density} onChange={(event) => update("density", event.target.value as Preferences["density"])}><option>Comfortable</option><option>Compact</option></select></div>
    <div className="setting-row"><div><strong>{locale === "ko" ? "PDF 열기" : "PDF opening"}</strong></div><select value={value.pdf} onChange={(event) => update("pdf", event.target.value as Preferences["pdf"])}><option>Inline viewer</option><option>New tab</option></select></div>
    <div className="setting-row"><div><strong>{locale === "ko" ? "화면 테마" : "Theme"}</strong></div><select value={value.theme} onChange={(event) => update("theme", event.target.value as Preferences["theme"])}><option>System</option><option>Light</option><option>Dark</option></select></div>
    <div className="setting-row"><div><strong>{locale === "ko" ? "최근 연구 수" : "Recent-run limit"}</strong></div><input aria-label="Recent-run limit" type="number" min={3} max={10} value={value.recent} onChange={(event) => update("recent", Number(event.target.value))} /></div>
    <p className="save-status" aria-live="polite">{saved ? (locale === "ko" ? "설정을 저장했습니다." : "Preferences saved.") : (locale === "ko" ? "계정이나 서버에는 저장하지 않습니다." : "No account or server storage is used.")}</p>
  </div>;
}
