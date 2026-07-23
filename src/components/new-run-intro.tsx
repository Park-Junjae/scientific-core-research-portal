"use client";

import { useLocale } from "@/lib/locale";

export function NewRunIntro() {
  const { locale } = useLocale();
  return (
    <div className="page-heading-row new-run-heading">
      <div>
        <h1>{locale === "ko" ? "새 연구 요청" : "New research request"}</h1>
        <p className="page-lede">
          {locale === "ko"
            ? "연구하고 싶은 내용을 자연어로 적으면 전체 연구 명세로 정리할 수 있습니다."
            : "Describe what you want to investigate in natural language; it can be compiled into the full research specification."}
        </p>
      </div>
    </div>
  );
}
