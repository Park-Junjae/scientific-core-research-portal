"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import styles from "./landing-page.module.css";

/* The stage identifiers below are the run's real pipeline manifest, in order,
   not a simplification for display. presearch_idea_freeze is stage 7 of 14, so
   the barrier falls where it actually falls: six ideation stages above it,
   seven verification stages below.

   Nothing on this page states a usage figure, a customer, or a result. */

type Stage = { id: string; ko: string; en: string; koNote?: string; enNote?: string };

const IDEATION: Stage[] = [
  {
    id: "scientific_framing",
    ko: "문제 재구성", en: "Reframe the problem",
    koNote: "해결책을 제안하기 전에 무엇을 성공으로 볼지와 어떤 병목을 받아들일지 분리합니다.",
    enNote: "Before any solution is proposed, what counts as success is separated from the bottleneck being accepted.",
  },
  {
    id: "mechanistic_decomposition",
    ko: "기전 분해", en: "Decompose the mechanism",
    koNote: "인과 경로, 숨은 좌표, 수동이라 가정한 요소, 피할 수 없는 트레이드오프로 나눕니다.",
    enNote: "Causal edges, hidden coordinates, components assumed passive, and unavoidable trade-offs.",
  },
  { id: "blind_first_principles_ideation", ko: "제1원리 발상", en: "First-principles ideation" },
  { id: "cross_domain_analogy_transfer", ko: "교차 도메인 전이", en: "Cross-domain transfer" },
  { id: "constraint_inversion", ko: "제약 반전", en: "Constraint inversion" },
  { id: "geometry_proximity_timing_exploration", ko: "기하·근접·타이밍 탐색", en: "Geometry, proximity, timing" },
];

const VERIFICATION: Stage[] = [
  {
    id: "targeted_literature_audit",
    ko: "표적 문헌 대조", en: "Targeted literature audit",
    koNote: "동결된 각 아이디어를 검색된 출처에 대조해 선행 연구와 반증을 찾고 근거의 경계를 명시합니다.",
    enNote: "Each frozen idea is checked against retrieved sources for precedent and contradiction, with the evidence boundary stated.",
  },
  { id: "mechanism_family_grouping", ko: "기전 계열 분류", en: "Group into mechanism families" },
  { id: "proposal_development", ko: "제안 구체화", en: "Develop proposals" },
  {
    id: "skeptical_review",
    ko: "회의적 검토", en: "Skeptical review",
    koNote: "치명적 모순, 숨은 의존성, 대안 설명, 결정적 대조 실험을 찾습니다.",
    enNote: "Fatal contradictions, hidden dependencies, alternative explanations, and decisive controls.",
  },
  { id: "proposal_revision", ko: "제안 개정", en: "Revise proposals" },
  {
    id: "dual_axis_portfolio",
    ko: "이중축 포트폴리오", en: "Dual-axis portfolio",
    koNote: "발명성과 검증가능성을 별도 축으로 평가합니다. 둘을 합친 단일 점수는 만들지 않습니다.",
    enNote: "Invention and validation are scored on separate axes. No single blended score is produced.",
  },
  { id: "report_generation", ko: "보고서 생성", en: "Report generation" },
];

const MODES = [
  {
    enum: "STANDARD",
    ko: { name: "표준 연구", points: ["근거를 먼저 확인하는 방식", "초점을 좁힌 분석", "검증 가능한 결론"] },
    en: { name: "Standard", points: ["Evidence-first research", "Focused analysis", "Testable conclusions"] },
  },
  {
    enum: "BREAKTHROUGH_DISCOVERY",
    ko: {
      name: "돌파구 탐색",
      points: ["문헌 검색 이전의 광범위한 발상", "도메인을 넘나드는 기전 탐색", "신규성과 실현 가능성을 따로 평가"],
    },
    en: {
      name: "Breakthrough discovery",
      points: ["Broad ideation before literature search", "Cross-domain mechanism search", "Novelty and feasibility assessed separately"],
    },
  },
] as const;

export function LandingPage() {
  const { locale } = useLocale();
  const ko = locale === "ko";

  const renderStage = (stage: Stage, index: number) => {
    const note = ko ? stage.koNote : stage.enNote;
    return (
      <li key={stage.id} className={styles.stage}>
        <span className={styles.stageIndex}>{String(index).padStart(2, "0")}</span>
        <code className={styles.stageId}>{stage.id}</code>
        <span className={styles.stageLabel}>{ko ? stage.ko : stage.en}</span>
        {note && <p className={styles.stageNote}>{note}</p>}
      </li>
    );
  };

  return (
    <div className={`landing-root ${styles.root}`}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <h1 className={styles.title}>
            {ko ? "가설을 먼저 세우고, 그다음 문헌을 엽니다" : "Hypotheses first. Literature second."}
          </h1>
          <p className={styles.lede}>
            {ko
              ? "문헌을 먼저 읽으면 발상이 이미 발표된 것 주변으로 쏠립니다. 이 시스템은 아이디어를 먼저 만들어 해시와 함께 봉인한 다음에야 문헌 검색을 허용합니다. 어떤 가설이 선행 연구 없이 나왔는지 나중에도 확인할 수 있습니다."
              : "Reading the literature first anchors ideas to what has already been published. This system generates its ideas and seals them with a content hash before any retrieval is permitted — so you can still tell, afterwards, which hypotheses were arrived at independently."}
          </p>

          <div className={styles.actions}>
            <Link className={styles.cta} href={withBasePath(`/new-run/?lang=${locale}`)}>
              {ko ? "연구 시작하기" : "Start a research run"}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className={styles.secondary} href={withBasePath(`/about/?lang=${locale}`)}>
              {ko ? "설계 배경 읽기" : "Read the design notes"}
            </Link>
          </div>

          <ul className={styles.specs}>
            <li>{ko ? "14단계 파이프라인" : "14-stage pipeline"}</li>
            <li>{ko ? "이중축 평가" : "dual-axis assessment"}</li>
            <li>{ko ? "계정별 비공개" : "private per account"}</li>
          </ul>
        </header>

        <section className={styles.spine} aria-labelledby="pipeline-heading">
          <div className={styles.spineHead}>
            <h2 id="pipeline-heading">{ko ? "실행 순서" : "Execution order"}</h2>
            <p>
              {ko
                ? "아래는 실제 실행 매니페스트의 단계 이름과 순서입니다."
                : "These are the stage names and the order taken from the run manifest itself."}
            </p>
          </div>

          <p className={styles.phase}>{ko ? "발상" : "Ideation"}</p>
          <ol className={styles.stages}>{IDEATION.map((s, i) => renderStage(s, i + 1))}</ol>

          <div className={styles.barrier}>
            <div className={styles.barrierTop}>
              <span className={styles.stageIndex}>07</span>
              <code className={styles.barrierId}>presearch_idea_freeze</code>
              <span className={styles.barrierLabel}>{ko ? "아이디어 동결" : "Idea freeze"}</span>
            </div>
            <p className={styles.barrierNote}>
              {ko
                ? "생성된 아이디어 전체를 SHA-256과 함께 봉인합니다. 이 지점 이후로는 아이디어를 추가할 수 없고, 이 지점 이전에는 문헌 검색이 허용되지 않습니다."
                : "The full idea set is sealed with a SHA-256 digest. Nothing can be added to it after this point, and no retrieval is permitted before it."}
            </p>
            <div className={styles.barrierTop}>
              <span className={`${styles.access} ${styles.accessDenied}`}>
                {ko ? "01–06 문헌 차단" : "01–06 literature locked"}
              </span>
              <span className={`${styles.access} ${styles.accessAllowed}`}>
                {ko ? "08–14 문헌 허용" : "08–14 literature permitted"}
              </span>
            </div>
          </div>

          <p className={styles.phase}>{ko ? "검증" : "Verification"}</p>
          <ol className={styles.stages}>{VERIFICATION.map((s, i) => renderStage(s, i + 8))}</ol>
        </section>

        <section className={styles.modes} aria-labelledby="modes-heading">
          <h2 id="modes-heading">{ko ? "연구 모드" : "Research modes"}</h2>
          <p>
            {ko
              ? "위 순서는 돌파구 탐색 모드의 것입니다. 표준 연구는 발상 폭을 좁히고 근거 확인을 앞당깁니다."
              : "The order above is the breakthrough discovery mode. Standard narrows the ideation and brings evidence checking forward."}
          </p>

          <div className={styles.modeGrid}>
            {MODES.map((mode) => {
              const copy = ko ? mode.ko : mode.en;
              return (
                <article key={mode.enum} className={styles.mode}>
                  <h3 className={styles.modeName}>{copy.name}</h3>
                  <code className={styles.modeEnum}>{mode.enum}</code>
                  <ul>
                    {copy.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.close}>
          <p>
            {ko
              ? "형식을 맞출 필요는 없습니다. 지금 막힌 지점을 그대로 적으면 됩니다."
              : "No particular format is required. Describe where you are stuck, in your own words."}
          </p>
          <Link className={styles.cta} href={withBasePath(`/new-run/?lang=${locale}`)}>
            {ko ? "연구 시작하기" : "Start a research run"}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
