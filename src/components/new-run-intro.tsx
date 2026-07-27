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
            ? "연구하고 싶은 내용을 자연어로 적으면 전체 연구 명세로 정리하고, 실행 전 확인할 수 있습니다."
            : "Describe what you want to investigate in natural language; it can be compiled into the full research specification."}
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
