"use client";

import {
  BookOpen,
  FileJson,
  FileText,
  FlaskConical,
  Library,
  LoaderCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocale } from "@/lib/locale";
import {
  getPrivateRunBundle,
  readPrivateArtifact,
  type PrivateArtifact,
} from "@/lib/run-control-api";

const sections = [
  ["summary", "Summary", "요약", FileText],
  ["idea_manifest", "Ideas", "아이디어", FlaskConical],
  ["literature_ledger", "Literature", "문헌", Library],
  ["knowledge_background", "Knowledge", "지식 배경", BookOpen],
  ["run_specification", "Specification", "실행 명세", FileJson],
  ["pdf_report", "PDF", "PDF", FileText],
] as const;

function formatJson(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function PrivateRunReader({ runId }: { runId: string }) {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const [artifacts, setArtifacts] = useState<PrivateArtifact[]>([]);
  const [activeRole, setActiveRole] = useState<string>("summary");
  const [content, setContent] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPrivateRunBundle(runId)
      .then((bundle) => {
        setArtifacts(bundle.artifacts.filter((item) => item.status === "AVAILABLE"));
        setError("");
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Bundle unavailable.");
      })
      .finally(() => setBusy(false));
  }, [runId]);

  const selected = useMemo(
    () => artifacts.find((item) => item.role === activeRole),
    [activeRole, artifacts],
  );

  useEffect(() => {
    if (!selected) return;
    let nextPdfUrl = "";
    readPrivateArtifact(runId, selected.artifact_id)
      .then(async (blob) => {
        if (selected.mime_type === "application/pdf") {
          nextPdfUrl = URL.createObjectURL(blob);
          setPdfUrl(nextPdfUrl);
          setContent("");
        } else {
          const raw = await blob.text();
          setContent(selected.mime_type === "application/json" ? formatJson(raw) : raw);
          setPdfUrl("");
        }
        setError("");
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Artifact unavailable.");
      })
      .finally(() => setBusy(false));
    return () => {
      if (nextPdfUrl) URL.revokeObjectURL(nextPdfUrl);
    };
  }, [runId, selected]);

  if (busy && artifacts.length === 0) {
    return (
      <p className="control-loading">
        <LoaderCircle className="spin" size={18} />
        {ko ? "비공개 결과를 불러오는 중입니다." : "Loading private results."}
      </p>
    );
  }
  if (error && artifacts.length === 0) {
    return <p className="control-error">{error}</p>;
  }

  return (
    <section className="private-result-reader">
      <div className="section-heading">
        <div>
          <p className="section-label">{ko ? "소유자 전용" : "Owner only"}</p>
          <h2>{ko ? "비공개 연구 결과" : "Private research results"}</h2>
        </div>
        <span>{artifacts.length}{ko ? "개 파일" : " files"}</span>
      </div>
      <div className="private-result-tabs" role="tablist">
        {sections.map(([role, en, kr, Icon]) => {
          const available = artifacts.some((item) => item.role === role);
          return (
            <button
              key={role}
              type="button"
              role="tab"
              aria-selected={activeRole === role}
              disabled={!available}
              className={activeRole === role ? "active" : ""}
              onClick={() => {
                setBusy(true);
                setActiveRole(role);
              }}
            >
              <Icon size={16} /> {ko ? kr : en}
            </button>
          );
        })}
      </div>
      <div className="private-result-content">
        {busy ? (
          <p className="control-loading">
            <LoaderCircle className="spin" size={18} />
            {ko ? "파일을 여는 중입니다." : "Opening file."}
          </p>
        ) : selected?.mime_type === "application/pdf" && pdfUrl ? (
          <iframe title={selected.filename} src={pdfUrl} className="private-pdf-frame" />
        ) : selected?.mime_type === "text/markdown" ? (
          <article className="report-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        ) : (
          <pre className="private-json-view">{content}</pre>
        )}
      </div>
      {error && <p className="control-error">{error}</p>}
    </section>
  );
}
