"use client";

import { Download, ExternalLink, Languages, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { withBasePath } from "@/lib/paths";
import { usePreferences } from "@/lib/preferences";
import { MarkdownArticle } from "./markdown-article";

type KnowledgeDocument = { label: string; markdown: string; pdf?: string };

export function KnowledgeReader({ documents }: { documents: Record<string, KnowledgeDocument> }) {
  const { preferences } = usePreferences();
  const languages = useMemo(() => Object.keys(documents), [documents]);
  const preferredLanguage = preferences.language === "Korean" ? "ko" : "en";
  const [languageOverride, setLanguageOverride] = useState<string | null>(null);
  const language = languageOverride ?? (languages.includes(preferredLanguage) ? preferredLanguage : languages[0]);
  const [query, setQuery] = useState("");
  const { markdown, pdf } = documents[language] ?? Object.values(documents)[0];
  const headings = useMemo(() => markdown.split("\n").filter((line) => line.startsWith("## ")).map((line) => line.slice(3)), [markdown]);
  const occurrences = query.trim() ? markdown.toLowerCase().split(query.trim().toLowerCase()).length - 1 : 0;
  return (
    <div className="knowledge-layout">
      <aside className="page-outline">
        <strong>On this page</strong>
        <nav>{headings.map((heading) => <a key={heading} href={`#${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}>{heading}</a>)}</nav>
      </aside>
      <div>
        <div className="knowledge-tools">
          {languages.length > 1 && <label className="knowledge-language"><Languages size={17} /><span className="sr-only">Knowledge language</span><select value={language} onChange={(event) => setLanguageOverride(event.target.value)}>{languages.map((code) => <option key={code} value={code}>{documents[code].label}</option>)}</select></label>}
          <label><Search size={17} /><span className="sr-only">Search this knowledge report</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this report" /></label>
          {query && <span>{occurrences} text {occurrences === 1 ? "match" : "matches"}</span>}
          {pdf && <><a className="icon-button" title="Open knowledge PDF" aria-label="Open knowledge PDF" href={withBasePath(pdf)} target="_blank" rel="noreferrer"><ExternalLink size={17} /></a><a className="icon-button" title="Download knowledge PDF" aria-label="Download knowledge PDF" href={withBasePath(pdf)} download><Download size={17} /></a></>}
        </div>
        <MarkdownArticle markdown={markdown} />
      </div>
    </div>
  );
}
