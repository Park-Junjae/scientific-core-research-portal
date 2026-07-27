import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/lib/locale";
import type { BreakthroughDiscoveryView as BreakthroughData } from "@/lib/types";
import { BreakthroughDiscoveryView } from "./breakthrough-discovery-view";

const data: BreakthroughData = {
  presearch_freeze_digest: "fixture-digest",
  presearch_ideas: [
    {
      spark_id: "SPARK-001",
      title: { en: "Conditional state routing", ko: "조건부 상태 경로 전환" },
      summary: { en: "Route a rare productive state.", ko: "희귀한 생산적 상태로 경로를 전환합니다." },
      generation_lens: "BOTTLENECK_REFRAMING",
      provenance_category: "FIRST_PRINCIPLES_SPECULATION",
    },
  ],
  mechanism_families: [
    {
      family_id: "FAMILY-01",
      thesis: { en: "State routing", ko: "상태 경로 전환" },
      shared_causal_variable: { en: "Productive-state occupancy", ko: "생산적 상태 점유율" },
      member_count: 4,
    },
  ],
  novelty_audit_summary: {
    en: "No direct precedent was identified within the synthetic scope; this is not proof of novelty.",
    ko: "합성 검토 범위에서 직접 선례를 확인하지 못했으며, 이는 신규성의 증명이 아닙니다.",
  },
  developed_proposals: [
    {
      proposal_id: "PROPOSAL-01",
      title: { en: "Conditional state gate", ko: "조건부 상태 게이트" },
      core_thesis: { en: "Bias state occupancy.", ko: "상태 점유율을 선택적으로 바꿉니다." },
      evidence_status: { en: "Component-level precedent only.", ko: "구성요소 수준 선례만 있습니다." },
      invention_band: "HIGH",
      validation_band: "LOW",
      lane: "HIGH_RISK_BREAKTHROUGH",
    },
  ],
  finalists: [],
};

describe("BreakthroughDiscoveryView", () => {
  it("keeps pre-search, evidence, and dual-axis sections distinct", () => {
    render(<LocaleProvider><BreakthroughDiscoveryView data={data} /></LocaleProvider>);
    expect(screen.getByRole("heading", { name: "Pre-search ideas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Novelty and precedent audit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dual-axis portfolio" })).toBeInTheDocument();
    expect(screen.getByText("No finalist met the current threshold")).toBeInTheDocument();
    expect(screen.queryByText(/overall score: [0-9]/i)).not.toBeInTheDocument();
  });
});
