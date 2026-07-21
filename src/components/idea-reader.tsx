"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Download, ExternalLink, FileText, Languages } from "lucide-react";
import { useMemo, useState } from "react";
import { withBasePath } from "@/lib/paths";
import { lifecycleLabels, scoreVector } from "@/lib/portfolio";
import { usePreferences } from "@/lib/preferences";
import type { ResearchIdeaManifest } from "@/lib/types";
import { MarkdownArticle } from "./markdown-article";
import { PdfViewer } from "./pdf-viewer";

export function IdeaReader({ idea, markdownByLanguage }: { idea: ResearchIdeaManifest; markdownByLanguage: Record<string, string> }) {
  const { preferences } = usePreferences();
  const languages = useMemo(() => Array.from(new Set([
    ...Object.keys(idea.report_markdown ?? {}),
    ...Object.keys(idea.report_pdf ?? {}),
  ])), [idea.report_markdown, idea.report_pdf]);
  const preferredLanguage = preferences.language === "Korean" ? "ko" : "en";
  const [languageOverride, setLanguageOverride] = useState<string | null>(null);
  const language = languageOverride ?? (languages.includes(preferredLanguage) ? preferredLanguage : languages[0] ?? "en");
  const hasMarkdown = Object.keys(idea.report_markdown ?? {}).length > 0;
  const hasPdf = Object.keys(idea.report_pdf ?? {}).length > 0;
  const [view, setView] = useState(hasMarkdown ? "read" : "pdf");
  const pdf = idea.report_pdf?.[language] ?? Object.values(idea.report_pdf ?? {})[0];
  const markdown = markdownByLanguage[language] ?? Object.values(markdownByLanguage)[0];

  return (
    <>
      <section className="idea-evidence-profile" aria-labelledby="idea-scientific-summary">
        <div className="idea-profile-lead">
          <p className="eyebrow">{lifecycleLabels[idea.lifecycle_status]}</p>
          <h2 id="idea-scientific-summary">Scientific summary</h2>
          <p>{idea.scientific_summary}</p>
        </div>
        <dl className="idea-profile-grid">
          <div><dt>Causal mechanism</dt><dd>{idea.causal_mechanism}</dd></div>
          <div><dt>Evidence basis</dt><dd>{idea.evidence_basis}</dd></div>
          <div><dt>Nearest prior art</dt><dd>{idea.nearest_prior_art || "No direct match recorded."}</dd></div>
          <div><dt>Strongest reason</dt><dd>{idea.strongest_reason}</dd></div>
          <div><dt>Weakest causal edge</dt><dd>{idea.weakest_causal_edge}</dd></div>
          <div><dt>Disposition</dt><dd>{idea.disposition_reason}</dd></div>
          <div><dt>Pairwise comparison</dt><dd>{idea.pairwise_summary || "No pairwise comparison was required for this object."}</dd></div>
          <div><dt>Next discriminating experiment</dt><dd>{idea.next_discriminating_experiment}</dd></div>
        </dl>
        {idea.scorecard && <div className="scorecard"><h3>Multi-axis scorecard</h3><div>{scoreVector(idea).map((item) => <span key={item.axis}><small>{item.label}</small><strong>{item.score}<i>/5</i></strong></span>)}</div><p>Scores are advisory vectors. Fatal objections cannot be offset by a total.</p></div>}
        <div className="reviewer-profile"><h3>Reviewer critiques</h3>{idea.reviewer_critiques.length > 0 ? <ul>{idea.reviewer_critiques.map((critique) => <li key={critique}>{critique}</li>)}</ul> : <p>No public critique was recorded.</p>}{idea.reviewer_disagreement && <p><strong>Disagreement:</strong> {idea.reviewer_disagreement}</p>}{idea.has_fatal_flaw && <p className="fatal-flaw"><strong>Fatal flaw:</strong> {idea.fatal_flaw}</p>}{idea.reentry_condition && <p><strong>Re-entry condition:</strong> {idea.reentry_condition}</p>}</div>
      </section>
      {!hasMarkdown && !hasPdf ? <div className="summary-only-note"><FileText size={18} /><div><strong>Summary-only idea record</strong><p>This idea remains part of the run portfolio without a dedicated PDF or Markdown report.</p></div></div> : <>
        <div className="idea-actions">
          {languages.length > 1 && <label className="language-select"><Languages size={17} /><span className="sr-only">Report language</span><select value={language} onChange={(event) => setLanguageOverride(event.target.value)}>{languages.map((code) => <option key={code} value={code}>{idea.language_variants[code] ?? code.toUpperCase()}</option>)}</select></label>}
          {pdf && (preferences.pdf === "Inline viewer" ? <button className="secondary-button" type="button" onClick={() => setView("pdf")}><ExternalLink size={17} />Open PDF</button> : <a className="secondary-button" href={withBasePath(pdf)} target="_blank" rel="noreferrer"><ExternalLink size={17} />Open PDF</a>)}
          {pdf && <a className="secondary-button" href={withBasePath(pdf)} download><Download size={17} />Download</a>}
        </div>
        <Tabs.Root value={view} onValueChange={setView} className="reader-tabs">
          <Tabs.List className="reader-tab-list" aria-label="Idea report views">
            {hasMarkdown && <Tabs.Trigger value="read"><FileText size={16} />Read</Tabs.Trigger>}
            {hasPdf && <Tabs.Trigger value="pdf">PDF</Tabs.Trigger>}
            <Tabs.Trigger value="references">References</Tabs.Trigger>
            <Tabs.Trigger value="files">Files</Tabs.Trigger>
          </Tabs.List>
          {hasMarkdown && <Tabs.Content value="read"><MarkdownArticle markdown={markdown ?? ""} /></Tabs.Content>}
          {pdf && <Tabs.Content value="pdf"><PdfViewer src={pdf} title={idea.title} /></Tabs.Content>}
          <Tabs.Content value="references"><div className="reader-empty"><h2>References</h2><p>{idea.reference_count} numbered demonstration references are associated with this idea. Publication exports retain only approved citations.</p></div></Tabs.Content>
          <Tabs.Content value="files"><div className="reader-empty"><h2>Approved files</h2><p>Only the PDF and Markdown variants listed here are approved publication artifacts for this idea.</p></div></Tabs.Content>
        </Tabs.Root>
      </>}
    </>
  );
}
