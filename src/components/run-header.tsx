import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/display";
import { withBasePath } from "@/lib/paths";
import type { ResearchRunManifest } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export function RunHeader({ run }: { run: ResearchRunManifest }) {
  const primaryReport = run.report_refs.find((item) => item.kind === "PDF");
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
            <a className="primary-button" href={withBasePath(primaryReport.path)} target="_blank" rel="noreferrer"><ExternalLink size={17} />Open report</a>
            <a className="secondary-button" href={withBasePath(primaryReport.path)} download><Download size={17} />Download</a>
          </div>
        )}
      </div>
      <div className="tag-row run-tags">{run.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </header>
  );
}
