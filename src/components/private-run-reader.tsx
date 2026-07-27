"use client";

import {
  Archive,
  BookOpen,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  FlaskConical,
  Library,
  LoaderCircle,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getPrivateRunBundle,
  privateArtifactUrl,
  readPrivateArtifact,
  type PrivateArtifact,
} from "@/lib/run-control-api";
import { useLocale } from "@/lib/locale";

const supportingRoles = [
  [["source_ledger", "literature_ledger"], "Source ledger", "문헌 원장", Library],
  [["artifact_manifest"], "Artifact manifest", "산출물 목록", FileJson],
  [["idea_manifest"], "Idea manifest", "아이디어 목록", FlaskConical],
  [["run_specification"], "Run specification", "연구 실행 명세", FileJson],
  [["integrity_audit"], "Integrity audit", "무결성 점검", ShieldCheck],
  [["cost_report"], "Cost report", "비용 보고서", WalletCards],
] as const;

function mergeManifestMetadata(
  artifacts: PrivateArtifact[],
  manifestArtifacts: PrivateArtifact[],
) {
  const metadata = new Map(
    manifestArtifacts.map((artifact) => [artifact.artifact_id, artifact.metadata]),
  );
  return artifacts.map((artifact) => ({
    ...artifact,
    metadata: artifact.metadata ?? metadata.get(artifact.artifact_id),
  }));
}

export function PrivateRunReader({ runId }: { runId: string }) {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const [artifacts, setArtifacts] = useState<PrivateArtifact[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPrivateRunBundle(runId)
      .then((bundle) => {
        setArtifacts(
          mergeManifestMetadata(
            bundle.artifacts.filter((item) => item.status === "AVAILABLE"),
            bundle.manifest.artifacts,
          ),
        );
        setError("");
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Bundle unavailable.");
      })
      .finally(() => setBusy(false));
  }, [runId]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const canonicalPdf = useMemo(
    () => artifacts.find((item) => item.role === "pdf_report" && item.mime_type === "application/pdf"),
    [artifacts],
  );
  const markdown = useMemo(
    () => artifacts.find((item) => item.role === "summary" && item.mime_type === "text/markdown")
      ?? artifacts.find((item) => item.mime_type === "text/markdown"),
    [artifacts],
  );
  const completeBundle = artifacts.find((item) => item.role === "complete_bundle");

  async function openPdf() {
    if (!canonicalPdf || busy) return;
    setBusy(true);
    setError("");
    try {
      const blob = await readPrivateArtifact(runId, canonicalPdf.artifact_id, "inline");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to open PDF.");
    } finally {
      setBusy(false);
    }
  }

  if (busy && artifacts.length === 0) {
    return <p className="control-loading"><LoaderCircle className="spin" size={18} />{ko ? "비공개 결과를 불러오는 중입니다." : "Loading private results."}</p>;
  }
  if (error && artifacts.length === 0) {
    return <p className="control-error">{error}</p>;
  }

  return (
    <section className="private-result-reader artifact-center">
      <div className="section-heading">
        <div>
          <p className="section-label">{ko ? "내 비공개 결과" : "Private to your account"}</p>
          <h2>{ko ? "연구 결과 파일" : "Research result artifacts"}</h2>
        </div>
        <span>{artifacts.length}{ko ? "개 파일" : " files"}</span>
      </div>

      {canonicalPdf ? (
        <article className="canonical-artifact">
          <div>
            <p className="document-role">{ko ? "최종 보고서" : "Canonical report"}</p>
            <h3>{canonicalPdf.metadata?.title ?? canonicalPdf.filename}</h3>
            <p className="artifact-metadata">
              {canonicalPdf.metadata?.language?.toUpperCase()}
              {canonicalPdf.metadata?.page_count ? ` · ${canonicalPdf.metadata.page_count} ${ko ? "쪽" : "pages"}` : ""}
              {canonicalPdf.metadata?.reference_count ? ` · ${canonicalPdf.metadata.reference_count} ${ko ? "개 참고문헌" : "references"}` : ""}
              {canonicalPdf.metadata?.updated_at ? ` · ${new Date(canonicalPdf.metadata.updated_at).toLocaleString(locale)}` : ""}
            </p>
          </div>
          <div className="document-actions">
            <button type="button" onClick={openPdf} disabled={busy}><ExternalLink size={16} />{ko ? "PDF 열기" : "Open PDF"}</button>
            <a href={privateArtifactUrl(runId, canonicalPdf.artifact_id, "attachment")}><Download size={16} />{ko ? "PDF 다운로드" : "Download PDF"}</a>
          </div>
        </article>
      ) : (
        <p className="muted-text">{ko ? "사용 가능한 최종 PDF가 없습니다." : "No available canonical PDF."}</p>
      )}

      <div className="artifact-download-grid">
        {markdown && <a href={privateArtifactUrl(runId, markdown.artifact_id, "attachment")}><FileText size={18} /><span><strong>{ko ? "편집 가능한 원본" : "Editable source"}</strong><small>{ko ? "Markdown 다운로드" : "Download Markdown"}</small></span></a>}
        {completeBundle && <a href={privateArtifactUrl(runId, completeBundle.artifact_id, "attachment")}><Archive size={18} /><span><strong>{ko ? "전체 결과" : "Complete result"}</strong><small>{ko ? "ZIP 다운로드" : "Download ZIP"}</small></span></a>}
      </div>

      <div className="supporting-artifacts">
        <h3>{ko ? "근거와 실행 기록" : "Supporting artifacts"}</h3>
        <div>
          {supportingRoles.map(([roles, en, kr, Icon]) => {
            const artifact = artifacts.find((item) => roles.some((role) => role === item.role));
            return artifact ? (
              <a key={roles[0]} href={privateArtifactUrl(runId, artifact.artifact_id, "attachment")}>
                <Icon size={17} /><span>{ko ? kr : en}</span><Download size={15} />
              </a>
            ) : null;
          })}
        </div>
      </div>

      {previewUrl && <iframe title={canonicalPdf?.filename ?? "PDF report"} src={previewUrl} className="private-pdf-frame" />}
      {busy && <p className="control-loading"><LoaderCircle className="spin" size={18} />{ko ? "파일을 여는 중입니다." : "Opening file."}</p>}
      {error && <p className="control-error">{error}</p>}
      <p className="privacy-note"><BookOpen size={15} />{ko ? "이 파일은 인증된 소유자에게만 제공되며 정적 공개 사이트에 포함되지 않습니다." : "These artifacts are available only to the authenticated owner and are not part of the static public build."}</p>
    </section>
  );
}
