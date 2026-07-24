"use client";

import { localized, useLocale } from "@/lib/locale";
import type { BreakthroughDiscoveryView as BreakthroughData } from "@/lib/types";

const provenanceLabels = {
  GROUNDED_EXTENSION: { ko: "근거 기반 확장", en: "Grounded extension" },
  CROSS_DOMAIN_TRANSFER: { ko: "타 분야 원리 이전", en: "Cross-domain transfer" },
  FIRST_PRINCIPLES_SPECULATION: { ko: "제1원리 추론", en: "First-principles speculation" },
} as const;

function bandLabel(band: "HIGH" | "MODERATE" | "LOW", locale: "ko" | "en") {
  const labels = {
    HIGH: { ko: "높음", en: "High" },
    MODERATE: { ko: "중간", en: "Moderate" },
    LOW: { ko: "낮음", en: "Low" },
  } as const;
  return labels[band][locale];
}

export function BreakthroughDiscoveryView({ data }: { data: BreakthroughData }) {
  const { locale } = useLocale();
  const highRisk = data.developed_proposals.filter((item) => item.lane === "HIGH_RISK_BREAKTHROUGH");
  return (
    <div className="breakthrough-view">
      <header className="breakthrough-intro">
        <p className="section-label">Breakthrough Discovery</p>
        <h2>{locale === "ko" ? "아이디어가 만들어지고 검토된 흐름" : "How ideas were generated and reviewed"}</h2>
        <p>
          {locale === "ko"
            ? "표적 문헌 검색 전에 원시 아이디어를 동결했습니다. 이후 문헌은 선례와 반증을 확인하는 데 사용했으며, 발명성과 검증 준비도는 서로 합치지 않았습니다."
            : "Raw ideas were frozen before targeted literature search. Literature was then used to audit precedent and contradiction; invention and validation readiness remain separate."}
        </p>
      </header>

      <nav className="breakthrough-jump" aria-label={locale === "ko" ? "돌파형 탐색 섹션" : "Breakthrough sections"}>
        <a href="#presearch-ideas">{locale === "ko" ? "검색 전 아이디어" : "Pre-search ideas"}</a>
        <a href="#mechanism-families">{locale === "ko" ? "기전군" : "Mechanism families"}</a>
        <a href="#novelty-audit">{locale === "ko" ? "신규성 검토" : "Novelty audit"}</a>
        <a href="#developed-proposals">{locale === "ko" ? "개발 제안" : "Developed proposals"}</a>
        <a href="#high-risk-breakthrough">{locale === "ko" ? "고위험 돌파형" : "High-risk breakthrough"}</a>
        <a href="#dual-axis-portfolio">{locale === "ko" ? "이중축 포트폴리오" : "Dual-axis portfolio"}</a>
      </nav>

      <section id="presearch-ideas" className="breakthrough-section">
        <div className="section-heading">
          <div>
            <p className="section-label">{locale === "ko" ? "문헌 검색 전 동결" : "Frozen before literature search"}</p>
            <h2>{locale === "ko" ? "검색 전 아이디어" : "Pre-search ideas"}</h2>
          </div>
          <span>{data.presearch_ideas.length}</span>
        </div>
        <details>
          <summary>{locale === "ko" ? "전체 원시 아이디어 보기" : "View the complete raw idea inventory"}</summary>
          <ol className="presearch-inventory">
            {data.presearch_ideas.map((idea) => (
              <li key={idea.spark_id}>
                <div>
                  <strong>{localized(idea.title, locale)}</strong>
                  <p>{localized(idea.summary, locale)}</p>
                </div>
                <small>{idea.generation_lens.replaceAll("_", " ")} · {provenanceLabels[idea.provenance_category][locale]}</small>
              </li>
            ))}
          </ol>
        </details>
      </section>

      <section id="mechanism-families" className="breakthrough-section">
        <div className="section-heading"><div><p className="section-label">{locale === "ko" ? "자연 분류" : "Natural grouping"}</p><h2>{locale === "ko" ? "기전군" : "Mechanism families"}</h2></div><span>{data.mechanism_families.length}</span></div>
        <div className="mechanism-family-list">
          {data.mechanism_families.map((family) => (
            <article key={family.family_id}>
              <div><h3>{localized(family.thesis, locale)}</h3><p>{localized(family.shared_causal_variable, locale)}</p></div>
              <span>{family.member_count} {locale === "ko" ? "개 아이디어" : "ideas"}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="novelty-audit" className="breakthrough-section">
        <p className="section-label">{locale === "ko" ? "동결 후 문헌 검토" : "Post-freeze literature review"}</p>
        <h2>{locale === "ko" ? "신규성 및 선례 검토" : "Novelty and precedent audit"}</h2>
        <p className="breakthrough-lede">{localized(data.novelty_audit_summary, locale)}</p>
      </section>

      <section id="developed-proposals" className="breakthrough-section">
        <p className="section-label">{locale === "ko" ? "검토된 연구 제안" : "Reviewed research proposals"}</p>
        <h2>{locale === "ko" ? "개발된 제안" : "Developed proposals"}</h2>
        <div className="developed-proposal-list">
          {data.developed_proposals.map((proposal) => (
            <article key={proposal.proposal_id}>
              <div><h3>{localized(proposal.title, locale)}</h3><p>{localized(proposal.core_thesis, locale)}</p><small>{localized(proposal.evidence_status, locale)}</small></div>
              <dl>
                <div><dt>{locale === "ko" ? "발명성" : "Invention"}</dt><dd>{bandLabel(proposal.invention_band, locale)}</dd></div>
                <div><dt>{locale === "ko" ? "검증 준비도" : "Validation"}</dt><dd>{bandLabel(proposal.validation_band, locale)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section id="high-risk-breakthrough" className="breakthrough-section">
        <p className="section-label">High-risk breakthrough</p>
        <h2>{locale === "ko" ? "근거가 적어도 보존한 아이디어" : "Ideas preserved despite limited direct evidence"}</h2>
        {highRisk.length
          ? <ul>{highRisk.map((item) => <li key={item.proposal_id}>{localized(item.title, locale)}</li>)}</ul>
          : <p>{locale === "ko" ? "이 실행에는 해당 제안이 없습니다." : "No proposal occupies this lane in this run."}</p>}
      </section>

      <section id="dual-axis-portfolio" className="breakthrough-section">
        <p className="section-label">{locale === "ko" ? "단일 종합점수 없음" : "No blended overall score"}</p>
        <h2>{locale === "ko" ? "이중축 포트폴리오" : "Dual-axis portfolio"}</h2>
        <div className="dual-axis-table" role="table">
          <div role="row"><span role="columnheader">{locale === "ko" ? "제안" : "Proposal"}</span><span role="columnheader">{locale === "ko" ? "발명성" : "Invention"}</span><span role="columnheader">{locale === "ko" ? "검증" : "Validation"}</span></div>
          {data.developed_proposals.map((proposal) => (
            <div role="row" key={proposal.proposal_id}><span role="cell">{localized(proposal.title, locale)}</span><span role="cell">{bandLabel(proposal.invention_band, locale)}</span><span role="cell">{bandLabel(proposal.validation_band, locale)}</span></div>
          ))}
        </div>
        <p className="muted-text">
          {data.finalists.length
            ? (locale === "ko" ? `Finalist ${data.finalists.length}개` : `${data.finalists.length} finalists`)
            : (locale === "ko" ? "현재 기준을 충족한 finalist 없음" : "No finalist met the current threshold")}
        </p>
      </section>
    </div>
  );
}
