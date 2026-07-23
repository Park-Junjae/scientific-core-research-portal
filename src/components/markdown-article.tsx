"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { localized, useLocale } from "@/lib/locale";
import type { ResearchSourceManifestV1 } from "@/lib/types";

export function headingId(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

function expandCitation(value: string) {
  return value.split(/\s*,\s*/).flatMap((part) => {
    const bounds = part.split(/\s*[-–]\s*/).map(Number);
    if (bounds.length !== 2) return bounds;
    const [start, end] = bounds;
    return Array.from({ length: Math.abs(end - start) + 1 }, (_, index) => Math.min(start, end) + index);
  });
}

function linkCitations(markdown: string, reportId: string | undefined, sources: ResearchSourceManifestV1[]) {
  if (!reportId || sources.length === 0) return markdown;
  const byNumber = new Map<number, ResearchSourceManifestV1>();
  for (const source of sources) for (const citation of source.cited_in_reports) if (citation.report_id === reportId) for (const number of citation.citation_numbers) byNumber.set(number, source);
  return markdown.replace(/\[(\d+(?:\s*(?:[-–,])\s*\d+)*)\]/g, (original, value: string) => {
    const links = expandCitation(value).map((number) => {
      const source = byNumber.get(number);
      return source ? `[${number}](#citation-${source.source_id})` : `[${number}]`;
    });
    return links.length ? links.join(",") : original;
  });
}

function concise(value: string | null, limit = 32) {
  if (!value) return value;
  const words = value.trim().split(/\s+/);
  return words.length > limit ? `${words.slice(0, limit).join(" ")}…` : value;
}

export function MarkdownArticle({ markdown, runSlug, reportId, sources = [] }: { markdown: string; runSlug?: string; reportId?: string; sources?: ResearchSourceManifestV1[] }) {
  const { locale, t } = useLocale();
  const [selected, setSelected] = useState<ResearchSourceManifestV1 | null>(null);
  const citationTrigger = useRef<HTMLButtonElement | null>(null);
  const returnFocusTo = useRef<string | null>(null);
  const linkedMarkdown = useMemo(() => linkCitations(markdown, reportId, sources), [markdown, reportId, sources]);
  const closePreview = useCallback(() => {
    returnFocusTo.current = citationTrigger.current?.dataset.citationSource ?? null;
    setSelected(null);
  }, []);
  useEffect(() => {
    if (selected || !returnFocusTo.current) return;
    const sourceId = returnFocusTo.current;
    returnFocusTo.current = null;
    document.querySelector<HTMLButtonElement>(`[data-citation-source="${sourceId}"]`)?.focus();
  }, [selected]);
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closePreview(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePreview, selected]);
  return <>
    <article className="prose-article"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      h2: ({ children }) => <h2 id={headingId(String(children))}>{children}</h2>,
      h3: ({ children }) => <h3 id={headingId(String(children))}>{children}</h3>,
      a: ({ href, children }) => {
        const source = href?.startsWith("#citation-") ? sources.find((item) => href === `#citation-${item.source_id}`) : null;
        return source ? <button type="button" className="citation-link" data-citation-source={source.source_id} aria-label={`${locale === "ko" ? "출처 미리보기" : "Preview source"}: ${String(children)}`} onClick={(event) => { citationTrigger.current = event.currentTarget; setSelected(source); }}>{children}</button> : <a href={href}>{children}</a>;
      },
    }}>{linkedMarkdown}</ReactMarkdown></article>
    {selected && runSlug && <aside className="citation-preview" role="dialog" aria-modal="false" aria-label={locale === "ko" ? "인용 출처 미리보기" : "Citation preview"}><button type="button" className="citation-close" onClick={closePreview} aria-label={locale === "ko" ? "미리보기 닫기" : "Close preview"}><X size={18} /></button><p className="source-role">{locale === "ko" ? "인용 출처" : "Cited source"}</p><h3>{localized(selected.localized_title, locale) ?? t("noTranslation")}</h3><p><strong>{t("whyItMatters")}</strong><br />{concise(localized(selected.localized_relevance, locale)) ?? t("noTranslation")}</p><p><strong>{t("whatShows")}</strong><br />{concise(localized(selected.localized_shows, locale)) ?? t("noTranslation")}</p><p><strong>{locale === "ko" ? "주요 한계" : "Principal limitation"}</strong><br />{concise(localized(selected.localized_does_not_show, locale)) ?? t("noTranslation")}</p><div className="source-links"><Link href={`/runs/${runSlug}/literature/${selected.source_id}/`}>{t("viewSource")}</Link>{selected.doi && <a href={`https://doi.org/${selected.doi}`} target="_blank" rel="noreferrer">DOI</a>}</div></aside>}
  </>;
}
