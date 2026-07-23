"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale, LocalizedText } from "./types";

const storageKey = "scientific-core-locale";

const copy = {
  en: {
    runs: "Runs", newRun: "New Run", about: "About", settings: "Settings",
    ideas: "Ideas", literature: "Literature", knowledge: "Knowledge Base", summary: "Summary", specification: "Run Specification",
    more: "More", reportsDownloads: "Reports and downloads", files: "Files", technical: "Technical details",
    publication: "Publication information", build: "Build information", status: "Status", runMode: "Run mode",
    domain: "Domain", updated: "Updated", all: "All", draft: "Draft", running: "Running",
    reviewRequired: "Review required", done: "Done", failed: "Failed", blocked: "Blocked", archived: "Archived",
    title: "Title", papersReviewed: "Papers reviewed", literatureAnalyzed: "Literature analyzed", lastUpdated: "Last updated", search: "Search research",
    noTranslation: "This content is not yet available in English.", viewEnglish: "View English", viewKorean: "View Korean",
    researchQuestion: "Research question", scientificSummary: "Scientific summary", mainReports: "Main research reports",
    literatureReviewed: "Literature reviewed", portfolioDecision: "Portfolio or decision", readingOrder: "Recommended reading order",
    readOnline: "Read online", openPdf: "Open PDF", download: "Download", read: "Read", references: "references",
    pages: "pages", language: "Language", reportType: "Report type", idea: "Idea", portfolioRole: "Portfolio role",
    rationale: "Scientific rationale", currentDecision: "Current decision", report: "Report", viewIdea: "Read idea",
    whyIdea: "Why this idea", evidence: "Evidence", proposedComparison: "Proposed comparison", expectedResult: "Expected result",
    mainReport: "Main report", detailedEvaluation: "Detailed evaluation", summaryOnly: "Approved scientific summary",
    noDedicatedReport: "No dedicated report is available for this research object.", onThisPage: "On this page",
    keyReferences: "key references", deeplyRead: "papers deeply read", fullTexts: "full texts reviewed",
    recordsDiscovered: "records discovered", abstractsReviewed: "abstracts reviewed", reportUnavailable: "Report unavailable",
    createRequest: "Create run request", researchRuns: "Research runs", noResults: "No matching runs",
    keyPapers: "Key papers", literatureScope: "Literature scope", allSources: "All sources", viewSource: "View source",
    whatShows: "What this source shows", whatDoesNotShow: "What it does not show", whyItMatters: "Why it matters",
    citedSources: "sources cited", reportReferences: "report references", accessLevel: "Access level",
  },
  ko: {
    runs: "연구 목록", newRun: "새 연구", about: "소개", settings: "설정",
    ideas: "아이디어", literature: "문헌", knowledge: "지식 배경", summary: "연구 요약", specification: "연구 명세",
    more: "기타 자료", reportsDownloads: "보고서 및 다운로드", files: "파일", technical: "기술 세부사항",
    publication: "공개 정보", build: "빌드 정보", status: "상태", runMode: "연구 유형",
    domain: "분야", updated: "수정", all: "전체", draft: "초안", running: "진행 중",
    reviewRequired: "검토 필요", done: "완료", failed: "실패", blocked: "중단", archived: "보관",
    title: "제목", papersReviewed: "검토 논문", literatureAnalyzed: "분석 문헌", lastUpdated: "최근 수정", search: "연구 내용 검색",
    noTranslation: "이 콘텐츠의 한국어 버전은 아직 없습니다.", viewEnglish: "영문 보기", viewKorean: "한국어 보기",
    researchQuestion: "연구 질문", scientificSummary: "연구 요약", mainReports: "주요 연구 보고서",
    literatureReviewed: "검토 문헌", portfolioDecision: "포트폴리오 및 결정", readingOrder: "권장 읽기 순서",
    readOnline: "온라인으로 읽기", openPdf: "PDF 열기", download: "다운로드", read: "읽기", references: "개 참고문헌",
    pages: "쪽", language: "언어", reportType: "보고서 유형", idea: "아이디어", portfolioRole: "포트폴리오 역할",
    rationale: "과학적 근거", currentDecision: "현재 결정", report: "보고서", viewIdea: "아이디어 읽기",
    whyIdea: "이 아이디어를 검토하는 이유", evidence: "근거", proposedComparison: "제안 비교", expectedResult: "예상 결과",
    mainReport: "주요 보고서", detailedEvaluation: "상세 평가", summaryOnly: "승인된 연구 요약",
    noDedicatedReport: "이 연구 대상에는 별도 보고서가 없습니다.", onThisPage: "이 페이지의 내용",
    keyReferences: "개 핵심 참고문헌", deeplyRead: "편 심층 검토", fullTexts: "편 전문 검토",
    recordsDiscovered: "건 검색", abstractsReviewed: "건 제목·초록 검토", reportUnavailable: "보고서 없음",
    createRequest: "연구 요청 작성", researchRuns: "연구 목록", noResults: "일치하는 연구가 없습니다",
    keyPapers: "핵심 논문", literatureScope: "문헌 범위", allSources: "전체 출처", viewSource: "출처 보기",
    whatShows: "이 출처가 보여주는 것", whatDoesNotShow: "보여주지 않는 것", whyItMatters: "이 연구에서 중요한 이유",
    citedSources: "개 출처 인용", reportReferences: "개 보고서 참고문헌", accessLevel: "확인 범위",
  },
} as const;

type CopyKey = keyof typeof copy.en;
type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: CopyKey) => string };
const LocaleContext = createContext<LocaleContextValue | null>(null);

function localeFromUrl(): Locale | null {
  if (typeof window === "undefined") return null;
  const value = new URL(window.location.href).searchParams.get("lang");
  return value === "ko" || value === "en" ? value : null;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const requested = localeFromUrl() ?? (localStorage.getItem(storageKey) === "ko" ? "ko" : "en");
    // Locale is a browser preference; hydrate it only after the client owns the URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(requested);
    document.documentElement.lang = requested;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("lang")) {
      url.searchParams.set("lang", requested);
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(storageKey, next);
    document.documentElement.lang = next;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const value = useMemo(() => ({ locale, setLocale, t: (key: CopyKey) => copy[locale][key] }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}

export function localized(value: LocalizedText | undefined, locale: Locale): string | null {
  const text = value?.[locale]?.trim();
  return text ? text : null;
}

export function localizedList(values: LocalizedText[], locale: Locale): string[] {
  return values.map((value) => localized(value, locale)).filter((value): value is string => Boolean(value));
}
