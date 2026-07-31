"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Lock,
  Microscope,
  Snowflake,
  Sparkles,
} from "lucide-react";
import { useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import styles from "./landing-page.module.css";

/* Every claim below describes what the pipeline actually does. There are no
   usage figures, customer names, or testimonials on this page, because none
   exist yet. */

const PIPELINE = [
  {
    ko: { title: "문제 재구성", body: "해결책을 제안하기 전에 연구 문제를 다시 정의하고, 무엇을 성공으로 볼지와 어떤 병목을 받아들일지 분리합니다." },
    en: { title: "Reframe the problem", body: "The research question is restated before any solution is proposed, separating what counts as success from the bottleneck being accepted." },
  },
  {
    ko: { title: "기전 분해", body: "인과 경로, 숨은 좌표, 암묵적으로 수동이라 가정한 요소, 피할 수 없는 트레이드오프를 나누어 봅니다." },
    en: { title: "Decompose the mechanism", body: "Causal edges, hidden coordinates, components assumed passive, and unavoidable trade-offs are separated out." },
  },
  {
    ko: { title: "다중 렌즈 발상", body: "병목 재구성, 교차 도메인 전이, 제약 반전 등 열 개의 렌즈로 서로 실질적으로 다른 가설을 만듭니다." },
    en: { title: "Ideate through ten lenses", body: "Bottleneck reframing, cross-domain transfer, constraint inversion and seven more lenses produce materially distinct hypotheses." },
  },
  {
    ko: { title: "아이디어 동결", body: "생성된 아이디어를 해시와 함께 봉인합니다. 이 시점 이후로는 새 아이디어를 추가할 수 없습니다." },
    en: { title: "Freeze the idea set", body: "The generated ideas are sealed with a content hash. Nothing can be added to the set after this point." },
  },
  {
    ko: { title: "문헌 대조", body: "동결된 각 아이디어를 문헌에 대조해 선행 연구와 반증 근거를 찾고, 근거의 경계를 명시합니다." },
    en: { title: "Audit against the literature", body: "Each frozen idea is checked against retrieved sources for precedent and contradiction, with the evidence boundary stated explicitly." },
  },
  {
    ko: { title: "회의적 검토와 보고", body: "치명적 모순과 결정적 대조 실험을 찾아낸 뒤, 발명성과 검증가능성을 별도 축으로 평가해 보고서를 만듭니다." },
    en: { title: "Review, then report", body: "Fatal contradictions and decisive controls are identified, then invention and validation are scored on separate axes for the final report." },
  },
] as const;

const MODES = [
  {
    icon: Microscope,
    ko: {
      name: "표준 연구",
      points: ["근거를 먼저 확인하는 방식", "초점을 좁힌 분석", "검증 가능한 결론"],
    },
    en: {
      name: "Standard",
      points: ["Evidence-first research", "Focused analysis", "Testable conclusions"],
    },
  },
  {
    icon: Sparkles,
    ko: {
      name: "돌파구 탐색",
      points: [
        "문헌 검색 이전의 광범위한 발상",
        "도메인을 넘나드는 기전 탐색",
        "신규성과 실현 가능성을 따로 평가",
      ],
    },
    en: {
      name: "Breakthrough discovery",
      points: [
        "Broad ideation before literature search",
        "Cross-domain mechanism search",
        "Novelty and feasibility assessed separately",
      ],
    },
  },
] as const;

export function LandingPage() {
  const { locale } = useLocale();
  const ko = locale === "ko";

  return (
    <div className={`landing-root ${styles.root}`}>
      <div className={styles.wash} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.badge}>
            <Snowflake size={14} aria-hidden="true" />
            {ko ? "아이디어 동결 후 문헌 대조" : "Ideas frozen before literature search"}
          </p>

          <h1 className={styles.title}>
            {ko ? "연구 질문에서" : "From a research question"}
            <em>{ko ? "검증 가능한 가설까지" : "to testable hypotheses"}</em>
          </h1>

          <p className={styles.lede}>
            {ko
              ? "연구 질문을 그대로 적으면, 문제를 다시 정의하고 기전을 분해해 서로 다른 가설을 만든 뒤 문헌에 대조하고 회의적으로 검토해 보고서로 정리합니다. 각 단계의 근거와 한계가 결과에 함께 남습니다."
              : "Describe your research question in plain language. The system reframes it, decomposes the mechanism, generates distinct hypotheses, audits them against the literature, reviews them skeptically, and writes up the result — carrying the evidence and its limits through every stage."}
          </p>

          <div className={styles.actions}>
            <Link className={styles.cta} href={withBasePath(`/new-run/?lang=${locale}`)}>
              {ko ? "연구 시작하기" : "Start a research run"}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className={styles.ghost} href={withBasePath(`/about/?lang=${locale}`)}>
              {ko ? "어떤 시스템인가" : "How it works"}
            </Link>
          </div>

          <p className={styles.privacyNote}>
            <Lock size={14} aria-hidden="true" />
            {ko
              ? "모든 연구 질문과 결과는 계정별 비공개로 처리됩니다."
              : "All research questions and results stay private to your account."}
          </p>
        </section>

        <section className={styles.section} aria-labelledby="pipeline-heading">
          <p className={styles.sectionLabel}>{ko ? "진행 방식" : "The pipeline"}</p>
          <h2 className={styles.sectionTitle} id="pipeline-heading">
            {ko ? "여섯 단계를 순서대로 지나갑니다" : "Six stages, always in this order"}
          </h2>
          <p className={styles.sectionLede}>
            {ko
              ? "단계마다 무엇을 근거로 삼았는지가 기록되고, 그 기록은 최종 보고서까지 이어집니다."
              : "Each stage records what it relied on, and that record carries through to the final report."}
          </p>

          <ol className={styles.pipeline}>
            {PIPELINE.map((stage) => {
              const copy = ko ? stage.ko : stage.en;
              return (
                <li key={copy.title} className={`${styles.pane} ${styles.step}`}>
                  <h3>{copy.title}</h3>
                  <p>{copy.body}</p>
                </li>
              );
            })}
          </ol>

          <div className={`${styles.pane} ${styles.freezeCallout}`}>
            <strong>
              {ko ? "왜 문헌보다 발상이 먼저인가" : "Why ideation comes before the literature"}
            </strong>
            <p>
              {ko
                ? "문헌을 먼저 읽으면 이미 발표된 것 주변으로 발상이 쏠립니다. 그래서 아이디어를 먼저 만들어 해시와 함께 동결한 다음에야 문헌 검색을 허용합니다. 어떤 아이디어가 선행 연구 없이 나온 것인지 나중에도 확인할 수 있습니다."
                : "Reading the literature first anchors ideas to what has already been published. So the idea set is generated and sealed with a content hash before any targeted retrieval is permitted — which means you can still tell, afterwards, which ideas were arrived at independently."}
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="modes-heading">
          <p className={styles.sectionLabel}>{ko ? "연구 모드" : "Research modes"}</p>
          <h2 className={styles.sectionTitle} id="modes-heading">
            {ko ? "질문의 성격에 따라 고릅니다" : "Chosen to match the question"}
          </h2>

          <div className={styles.modes}>
            {MODES.map(({ icon: Icon, ...mode }) => {
              const copy = ko ? mode.ko : mode.en;
              return (
                <article key={copy.name} className={`${styles.pane} ${styles.mode}`}>
                  <div className={styles.modeHead}>
                    <span className={styles.modeIcon}>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <h3>{copy.name}</h3>
                  </div>
                  <ul>
                    {copy.points.map((point) => (
                      <li key={point}>
                        <Check size={16} aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className={`${styles.pane} ${styles.closing}`}>
          <h2>{ko ? "연구 질문 하나로 시작합니다" : "It starts with one research question"}</h2>
          <p>
            {ko
              ? "형식을 맞출 필요는 없습니다. 지금 막힌 지점을 그대로 적으면 됩니다."
              : "No particular format is required. Describe where you are stuck, in your own words."}
          </p>
          <Link className={styles.cta} href={withBasePath(`/new-run/?lang=${locale}`)}>
            {ko ? "연구 시작하기" : "Start a research run"}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
