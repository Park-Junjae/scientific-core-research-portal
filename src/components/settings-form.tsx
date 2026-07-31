"use client";

import { useState, type ReactNode } from "react";
import { useLocale } from "@/lib/locale";
import { usePreferences, type Preferences } from "@/lib/preferences";

/* Every control on this page changes something observable. A preference with no
   consumer is worse than a missing one, so nothing is listed here without the
   code that reads it. */

export function SettingsHeading() {
  const { locale } = useLocale();
  const ko = locale === "ko";
  return (
    <div className="page-heading-row">
      <div>
        <p className="eyebrow">{ko ? "이 기기의 설정" : "Local preferences"}</p>
        <h1>{ko ? "설정" : "Settings"}</h1>
        <p className="page-lede">
          {ko
            ? "이 워크스페이스가 이 기기에서 어떻게 보이고 동작할지 정합니다."
            : "Choose how this research workspace appears and behaves on this device."}
        </p>
      </div>
    </div>
  );
}

export function SettingsForm() {
  const { locale, setLocale } = useLocale();
  const ko = locale === "ko";
  const { preferences: value, updatePreference } = usePreferences();
  const [saved, setSaved] = useState(false);

  const markSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };
  const update = <Key extends keyof Preferences>(key: Key, next: Preferences[Key]) => {
    updatePreference(key, next);
    markSaved();
  };

  const row = (label: string, note: string, control: ReactNode) => (
    <div className="setting-row" key={label}>
      <div>
        <strong>{label}</strong>
        <small>{note}</small>
      </div>
      {control}
    </div>
  );

  return (
    <div className="settings-panel">
      <h2 className="settings-group-heading">{ko ? "화면" : "Interface"}</h2>

      {row(
        ko ? "언어" : "Language",
        ko ? "화면 전체에 적용됩니다." : "Applies across the interface.",
        <select
          aria-label={ko ? "언어" : "Language"}
          value={locale}
          onChange={(event) => { setLocale(event.target.value as "ko" | "en"); markSaved(); }}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>,
      )}

      {row(
        ko ? "읽기 밀도" : "Reading density",
        ko ? "보고서와 목록의 여백을 줄입니다." : "Tightens spacing in reports and lists.",
        <select
          aria-label={ko ? "읽기 밀도" : "Reading density"}
          value={value.density}
          onChange={(event) => update("density", event.target.value as Preferences["density"])}
        >
          <option value="Comfortable">{ko ? "보통" : "Comfortable"}</option>
          <option value="Compact">{ko ? "촘촘하게" : "Compact"}</option>
        </select>,
      )}

      {row(
        ko ? "화면 테마" : "Theme",
        ko ? "시스템을 고르면 기기 설정을 따릅니다." : "System follows the device setting.",
        <select
          aria-label={ko ? "화면 테마" : "Theme"}
          value={value.theme}
          onChange={(event) => update("theme", event.target.value as Preferences["theme"])}
        >
          <option value="System">{ko ? "시스템" : "System"}</option>
          <option value="Light">{ko ? "밝게" : "Light"}</option>
          <option value="Dark">{ko ? "어둡게" : "Dark"}</option>
        </select>,
      )}

      {row(
        ko ? "보고서 페이지 뷰어" : "Report page viewer",
        ko ? "보고서를 열 때 뷰어를 펼쳐 둘지 정합니다." : "Whether the viewer starts open on a report.",
        <select
          aria-label={ko ? "보고서 페이지 뷰어" : "Report page viewer"}
          value={value.pdf}
          onChange={(event) => update("pdf", event.target.value as Preferences["pdf"])}
        >
          <option value="Inline viewer">{ko ? "펼쳐서 열기" : "Open expanded"}</option>
          <option value="New tab">{ko ? "접어 두기" : "Keep collapsed"}</option>
        </select>,
      )}

      {row(
        ko ? "사이드바 최근 연구 수" : "Recent runs in the sidebar",
        ko ? "3에서 10까지." : "Between 3 and 10.",
        <input
          aria-label={ko ? "사이드바 최근 연구 수" : "Recent runs in the sidebar"}
          type="number"
          min={3}
          max={10}
          value={value.recent}
          onChange={(event) => update("recent", Number(event.target.value))}
        />,
      )}

      <h2 className="settings-group-heading">{ko ? "새 연구 기본값" : "New run defaults"}</h2>

      {row(
        ko ? "연구 모드" : "Research mode",
        ko ? "새 연구를 열 때 선택되어 있습니다." : "Pre-selected when a new run is opened.",
        <select
          aria-label={ko ? "연구 모드" : "Research mode"}
          value={value.defaultMode}
          onChange={(event) => update("defaultMode", event.target.value as Preferences["defaultMode"])}
        >
          <option value="STANDARD">{ko ? "표준 연구" : "Standard"}</option>
          <option value="BREAKTHROUGH_DISCOVERY">{ko ? "돌파구 탐색" : "Breakthrough discovery"}</option>
        </select>,
      )}

      {row(
        ko ? "보고서 언어" : "Report language",
        ko ? "지정하지 않으면 화면 언어를 따릅니다." : "Follows the interface language when left unset.",
        <select
          aria-label={ko ? "보고서 언어" : "Report language"}
          value={value.defaultReportLanguage}
          onChange={(event) =>
            update("defaultReportLanguage", event.target.value as Preferences["defaultReportLanguage"])
          }
        >
          <option value="">{ko ? "현재 화면 언어" : "Current portal language"}</option>
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="bilingual">{ko ? "한국어 + English" : "Korean + English"}</option>
        </select>,
      )}

      {row(
        ko ? "문헌 검토 포함" : "Include literature review",
        ko
          ? "문헌 검토와 전체 출처 원장을 기본으로 요청합니다."
          : "Requests the literature review and full source ledger by default.",
        <select
          aria-label={ko ? "문헌 검토 포함" : "Include literature review"}
          value={value.defaultLiteratureScope ? "on" : "off"}
          onChange={(event) => update("defaultLiteratureScope", event.target.value === "on")}
        >
          <option value="on">{ko ? "포함" : "Included"}</option>
          <option value="off">{ko ? "포함하지 않음" : "Not included"}</option>
        </select>,
      )}

      <h2 className="settings-group-heading">{ko ? "내 연구" : "My Research"}</h2>

      {row(
        ko ? "처음 열리는 탭" : "Tab shown first",
        ko ? "연구 목록을 열 때 선택되어 있습니다." : "Selected when the research list opens.",
        <select
          aria-label={ko ? "처음 열리는 탭" : "Tab shown first"}
          value={value.defaultResearchView}
          onChange={(event) =>
            update("defaultResearchView", event.target.value as Preferences["defaultResearchView"])
          }
        >
          <option value="active">{ko ? "진행 중" : "In progress"}</option>
          <option value="completed">{ko ? "완료" : "Completed"}</option>
          <option value="archived">{ko ? "보관됨" : "Archived"}</option>
        </select>,
      )}

      <p className="save-status" aria-live="polite">
        {saved
          ? (ko ? "설정을 저장했습니다." : "Preferences saved.")
          : (ko
            ? "이 기기에만 저장되며 계정이나 서버로 전송되지 않습니다."
            : "Stored on this device only; never sent to an account or server.")}
      </p>
    </div>
  );
}
