"use client";

import { FlaskConical, Library, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AccessConnectionPanel } from "@/components/access-connection-panel";
import { useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import {
  getMyRuns,
  runControlApiBase,
  type OwnerRunListItem,
  type RunControlSession,
} from "@/lib/run-control-api";

export function MyResearch() {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const [session, setSession] = useState<RunControlSession | null>(null);
  const [runs, setRuns] = useState<OwnerRunListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  async function connected(nextSession: RunControlSession) {
    setSession(nextSession);
    setLoading(true);
    setError("");
    try {
      const response = await getMyRuns(20, 0);
      setRuns(response.runs);
      setLoaded(true);
    } catch (reason) {
      setRuns([]);
      setSession(null);
      setLoaded(false);
      setError(reason instanceof Error ? reason.message : "Unable to load private research.");
    } finally {
      setLoading(false);
    }
  }

  if (!runControlApiBase) return null;

  return (
    <section className="page-container my-research-section">
      <div className="section-heading">
        <div>
          <p className="section-label">{ko ? "인증된 비공개 작업공간" : "Authenticated private workspace"}</p>
          <h2>{ko ? "내 연구" : "My Research"}</h2>
        </div>
        <span><LockKeyhole size={14} />{ko ? "정적 공개 연구와 분리됨" : "Separate from public static runs"}</span>
      </div>
      <p className="my-research-intro">
        {ko
          ? "위의 최근 연구는 공개 가능한 정적 자료입니다. 아래 목록은 인증된 계정이 생성한 비공개 실행만 Backend에서 불러옵니다."
          : "Recent research above is public static content. This list loads only private runs created by the authenticated account from the Backend."}
      </p>

      {!session && <AccessConnectionPanel onConnected={connected} compact />}
      {loading && (
        <p className="control-loading" role="status">
          <LoaderCircle className="spin" size={18} />
          {ko ? "내 비공개 연구를 불러오는 중입니다." : "Loading private research."}
        </p>
      )}
      {error && <p className="control-error" role="alert">{error}</p>}
      {session && loaded && runs.length === 0 && (
        <div className="my-research-empty">
          <FlaskConical size={20} />
          <div>
            <h3>{ko ? "이 계정으로 생성한 연구가 없습니다." : "No research for this account yet."}</h3>
            <p>{ko ? "새 연구 요청을 만들면 여기에 표시됩니다." : "Create a new research request to see it here."}</p>
          </div>
        </div>
      )}
      {runs.length > 0 && (
        <div className="my-research-list">
          {runs.map((run) => (
            <article key={run.run_id}>
              <div>
                <p className="my-research-meta">
                  <span>{run.status}</span>
                  <span>{run.current_stage.replaceAll("_", " ")}</span>
                  <span>{Math.round(run.progress_percentage)}%</span>
                </p>
                <h3>
                  <Link href={withBasePath(`/run-control/?run_id=${encodeURIComponent(run.run_id)}`)}>
                    {run.research_question || run.run_id}
                  </Link>
                </h3>
                <p>
                  {new Date(run.updated_at).toLocaleString(locale)}
                  {` · ${run.creativity_profile} · ${run.budget_profile}`}
                </p>
              </div>
              <dl>
                <div>
                  <dt><Library size={14} />{ko ? "분석 문헌" : "Analyzed"}</dt>
                  <dd>{run.literature_analyzed_count}</dd>
                </div>
                <div>
                  <dt>{ko ? "인용 출처" : "Cited"}</dt>
                  <dd>{run.cited_source_count}</dd>
                </div>
                <div>
                  <dt>{ko ? "Provider 비용" : "Provider cost"}</dt>
                  <dd>${run.provider_cost_usd.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>{ko ? "결과 파일" : "Artifacts"}</dt>
                  <dd>{run.artifact_availability.count}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
