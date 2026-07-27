"use client";

import { useLocale } from "@/lib/locale";
import type { LiteratureStats } from "@/lib/types";

export function LiteratureScope({
  stats,
  enabled = true,
  currentStage,
}: {
  stats: LiteratureStats;
  enabled?: boolean;
  currentStage?: string;
}) {
  const { locale } = useLocale();
  const ko = locale === "ko";

  if (!enabled) {
    return <p className="scope-excluded">{ko ? "문헌 분석 제외" : "Literature review excluded"}</p>;
  }

  const items = [
    [ko ? "발견" : "Discovered", stats.discovered],
    [ko ? "제목·초록 검토" : "Title and abstract", stats.title_abstract_screened],
    [ko ? "전문 검토" : "Full text", stats.full_text_reviewed],
    [ko ? "심층 분석" : "Deeply read", stats.deeply_read],
    [ko ? "보고서 인용" : "Cited in report", stats.unique_cited_sources],
    [ko ? "핵심 근거" : "Load-bearing", stats.load_bearing_sources],
  ] as const;

  return (
    <div>
      <div className="literature-funnel-grid">
        {items.map(([label, value]) => (
          <div key={label}><span>{label}</span><strong>{value ?? "—"}</strong></div>
        ))}
      </div>
      <p className="literature-ledger-summary">
        {ko ? "중복 제거 후 분석 문헌" : "Analyzed after deduplication"}: <strong>{stats.analyzed_unique_total ?? "—"}</strong>
        {stats.report_reference_count !== undefined && <> · {ko ? "보고서 참고문헌 항목" : "Report reference entries"}: <strong>{stats.report_reference_count}</strong></>}
        {currentStage && <> · {ko ? "현재 단계" : "Current stage"}: <strong>{currentStage.replaceAll("_", " ")}</strong></>}
      </p>
    </div>
  );
}
