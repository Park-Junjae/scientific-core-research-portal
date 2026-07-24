"use client";

import { useLocale } from "@/lib/locale";

export function NewRunIntro() {
  const { locale } = useLocale();
  return (
    <header className="new-run-heading">
      <div className="page-heading-row">
        <div>
          <p className="section-label">AI Cho-Scientist</p>
        <h1>{locale === "ko" ? "새 연구 요청" : "New research request"}</h1>
        <p className="page-lede">
          {locale === "ko"
              ? "질문, 목표와 반드시 지켜야 할 조건을 정리해 검토 가능한 연구 요청서를 만듭니다."
              : "Turn a question, objective, and required constraints into a research request ready for review."}
        </p>
        </div>
      </div>
      <ol className="request-stage-guide" aria-label={locale === "ko" ? "연구 실행 단계" : "Research execution stages"}>
        <li className="current"><span>1</span><div><strong>{locale === "ko" ? "요청서 준비" : "Prepare request"}</strong><small>{locale === "ko" ? "현재 단계" : "Current step"}</small></div></li>
        <li><span>2</span><div><strong>{locale === "ko" ? "실행 전 점검" : "No-provider preflight"}</strong><small>{locale === "ko" ? "범위와 공개 경계 확인" : "Check scope and publication boundary"}</small></div></li>
        <li><span>3</span><div><strong>{locale === "ko" ? "실행 승인" : "Execution approval"}</strong><small>{locale === "ko" ? "별도 확인 후에만 진행" : "Requires separate confirmation"}</small></div></li>
      </ol>
    </header>
  );
}
