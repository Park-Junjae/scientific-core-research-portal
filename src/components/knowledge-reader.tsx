"use client";

import { Download, ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { withBasePath } from "@/lib/paths";
import { MarkdownArticle } from "./markdown-article";

export function KnowledgeReader({ markdown, pdf }: { markdown: string; pdf?: string }) {
  const [query, setQuery] = useState("");
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
          <label><Search size={17} /><span className="sr-only">Search this knowledge report</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this report" /></label>
          {query && <span>{occurrences} text {occurrences === 1 ? "match" : "matches"}</span>}
          {pdf && <><a className="icon-button" title="Open knowledge PDF" aria-label="Open knowledge PDF" href={withBasePath(pdf)} target="_blank" rel="noreferrer"><ExternalLink size={17} /></a><a className="icon-button" title="Download knowledge PDF" aria-label="Download knowledge PDF" href={withBasePath(pdf)} download><Download size={17} /></a></>}
        </div>
        <MarkdownArticle markdown={markdown} />
      </div>
    </div>
  );
}
