"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Download, ExternalLink, FileText, Languages } from "lucide-react";
import { useState } from "react";
import { withBasePath } from "@/lib/paths";
import type { ResearchIdeaManifest } from "@/lib/types";
import { MarkdownArticle } from "./markdown-article";
import { PdfViewer } from "./pdf-viewer";

export function IdeaReader({ idea, markdownByLanguage }: { idea: ResearchIdeaManifest; markdownByLanguage: Record<string, string> }) {
  const languages = Object.keys(idea.language_variants);
  const [language, setLanguage] = useState(languages[0] ?? "en");
  const pdf = idea.report_pdf[language] ?? Object.values(idea.report_pdf)[0];
  const markdown = markdownByLanguage[language] ?? Object.values(markdownByLanguage)[0];

  return (
    <>
      <div className="idea-actions">
        <label className="language-select"><Languages size={17} /><span className="sr-only">Report language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}>{languages.map((code) => <option key={code} value={code}>{idea.language_variants[code]}</option>)}</select></label>
        <a className="secondary-button" href={withBasePath(pdf)} target="_blank" rel="noreferrer"><ExternalLink size={17} />Open PDF</a>
        <a className="secondary-button" href={withBasePath(pdf)} download><Download size={17} />Download</a>
      </div>
      <Tabs.Root defaultValue="read" className="reader-tabs">
        <Tabs.List className="reader-tab-list" aria-label="Idea report views">
          <Tabs.Trigger value="read"><FileText size={16} />Read</Tabs.Trigger>
          <Tabs.Trigger value="pdf">PDF</Tabs.Trigger>
          <Tabs.Trigger value="references">References</Tabs.Trigger>
          <Tabs.Trigger value="files">Files</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="read"><MarkdownArticle markdown={markdown} /></Tabs.Content>
        <Tabs.Content value="pdf"><PdfViewer src={pdf} title={idea.title} /></Tabs.Content>
        <Tabs.Content value="references"><div className="reader-empty"><h2>References</h2><p>{idea.reference_count} numbered demonstration references are included in the report text. Publication exports retain only approved citations.</p></div></Tabs.Content>
        <Tabs.Content value="files"><div className="reader-empty"><h2>Approved files</h2><p>The PDF and Markdown variants shown here are the complete approved file set for this demonstration idea.</p></div></Tabs.Content>
      </Tabs.Root>
    </>
  );
}
