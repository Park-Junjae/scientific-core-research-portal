"use client";

import { localized, useLocale } from "@/lib/locale";
import { lifecycleLabels } from "@/lib/portfolio";
import type { RunWithIdeas } from "@/lib/types";

export function RunPortfolioSummary({ run }: { run: RunWithIdeas }) {
  const { locale, t } = useLocale();
  return <table className="portfolio-table"><thead><tr><th>{t("idea")}</th><th>{t("portfolioRole")}</th><th>{t("currentDecision")}</th></tr></thead><tbody>{run.ideas.map((idea) => <tr key={idea.idea_id}><td>{localized(idea.title, locale) ?? t("noTranslation")}</td><td>{idea.idea_type.replaceAll("_", " ")}</td><td>{lifecycleLabels[locale][idea.lifecycle_status]}</td></tr>)}</tbody></table>;
}
