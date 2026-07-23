"use client";

import { localized, localizedList, useLocale } from "@/lib/locale";
import type { ResearchRunManifest } from "@/lib/types";

export function RunSpecification({ run }: { run: ResearchRunManifest }) {
  const { locale, t } = useLocale();
  const sections = [
    [t("researchQuestion"), localized(run.research_question, locale)],
    [locale === "ko" ? "연구 목표" : "Research goal", localized(run.research_goal, locale)],
    [locale === "ko" ? "현재 병목" : "Current bottleneck", localized(run.current_bottleneck, locale)],
  ] as const;
  const lists = [
    [locale === "ko" ? "성공 기준" : "Success criteria", localizedList(run.success_criteria, locale)],
    [locale === "ko" ? "실험 제약" : "Experimental constraints", localizedList(run.experimental_constraints, locale)],
    [locale === "ko" ? "비목표" : "Non-goals", localizedList(run.non_goals, locale)],
    [locale === "ko" ? "요청 산출물" : "Requested outputs", localizedList(run.requested_outputs, locale)],
  ] as const;
  return <article className="specification-document"><h1>{t("specification")}</h1>{sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body ?? t("noTranslation")}</p></section>)}{lists.map(([heading, items]) => <section key={heading}><h2>{heading}</h2>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{t("noTranslation")}</p>}</section>)}</article>;
}
