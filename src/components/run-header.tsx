"use client";

import Link from "next/link";
import { Download, ExternalLink, Languages } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/display";
import { withBasePath } from "@/lib/paths";
import { usePreferences } from "@/lib/preferences";
import type { ResearchRunManifest } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export function RunHeader({ run }: { run: ResearchRunManifest }) {
  const { preferences } = usePreferences();
  const [languageOverride, setLanguageOverride] = useState<string | null>(null);
  const preferredLanguage = preferences.language === "Korean" ? "ko" : "en";
  const language = languageOverride ?? (run.languages.includes(preferredLanguage) ? preferredLanguage : run.languages[0]);
  const primaryReport = run.report_refs.find((item) => item.kind === "PDF" && item.language === language) ?? run.report_refs.find((item) => item.kind === "PDF");
  return (
    <header className="run-header">
      <div className="breadcrumb"><Link href="/runs/">Runs</Link><span>/</span><span>{run.short_title}</span></div>
      <div className="run-header-grid">
        <div>
          <div className="run-kicker"><StatusBadge status={run.status} /><span>{run.research_domain}</span></div>
          <h1>{run.title}</h1>
          <p>{run.subtitle}</p>
          <div className="run-byline"><span>{run.owner}</span><span>Updated {formatDate(run.updated_at)}</span></div>
        </div>
        {primaryReport && (
          <div className="header-actions">
            {run.languages.length > 1 && <label className="language-select"><Languages size={17} /><span className="sr-only">Run language</span><select value={language} onChange={(event) => setLanguageOverride(event.target.value)}>{run.languages.map((code) => <option key={code} value={code}>{code === "ko" ? "Korean" : "English"}</option>)}</select></label>}
            <a className="primary-button" href={withBasePath(primaryReport.path)} target="_blank" rel="noreferrer"><ExternalLink size={17} />Open report</a>
            <a className="secondary-button" href={withBasePath(primaryReport.path)} download><Download size={17} />Download</a>
          </div>
        )}
      </div>
      <div className="tag-row run-tags">{run.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </header>
  );
}
