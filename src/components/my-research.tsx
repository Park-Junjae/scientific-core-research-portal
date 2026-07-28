"use client";

import {
  Clock3,
  FlaskConical,
  Library,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import {
  getMyRuns,
  runControlApiBase,
  type CreatorRunListItem,
  type RunControlSession,
} from "@/lib/run-control-api";

function profileLabel(run: CreatorRunListItem) {
  return run.creativity_profile === "BREAKTHROUGH_DISCOVERY"
    ? "Breakthrough Discovery"
    : "Standard";
}

function statusLabel(status: CreatorRunListItem["status"], ko: boolean) {
  const labels: Record<string, [string, string]> = {
    QUEUED: ["사전 검토 대기", "Awaiting preflight"],
    RUNNER_OFFLINE: ["Runner 연결 대기", "Waiting for runner"],
    PREFLIGHT: ["사전 검토 중", "Preflight"],
    AWAITING_APPROVAL: ["승인 대기", "Awaiting approval"],
    RUNNING: ["실행 중", "Running"],
    GENERATING_REPORTS: ["결과 작성 중", "Generating results"],
    COMPLETED: ["완료", "Completed"],
    FAILED: ["실패", "Failed"],
    CANCELLED: ["취소됨", "Cancelled"],
    QUEUE_EXPIRED: ["대기 만료", "Queue expired"],
  };
  const value = labels[status] ?? [status, status];
  return ko ? value[0] : value[1];
}

export function MyResearch({ session }: { session: RunControlSession | null }) {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const [result, setResult] = useState<{
    email: string;
    runs: CreatorRunListItem[];
    error: string;
  } | null>(null);
  const loaded = Boolean(session && result?.email === session.email);
  const runs = loaded ? result?.runs ?? [] : [];
  const error = loaded ? result?.error ?? "" : "";
  const loading = Boolean(session && !loaded);

  useEffect(() => {
    let active = true;
    if (!session) return () => { active = false; };
    void getMyRuns(20, 0)
      .then((response) => {
        if (!active) return;
        setResult({ email: session.email, runs: response.runs, error: "" });
      })
      .catch((reason) => {
        if (!active) return;
        setResult({
          email: session.email,
          runs: [],
          error: reason instanceof Error ? reason.message : "Unable to load private research.",
        });
      });
    return () => { active = false; };
  }, [session]);

  if (!runControlApiBase) return null;

  return (
    <section className="my-research-section" aria-labelledby="my-research-heading">
      <div className="section-heading">
        <div>
          <p className="section-label">{ko ? "비공개 실행 작업공간" : "Private execution workspace"}</p>
          <h2 id="my-research-heading">{ko ? "내 연구" : "My Research"}</h2>
        </div>
        <span><LockKeyhole size={14} />{ko ? "현재 계정 전용" : "Private to this account"}</span>
      </div>
      <p className="my-research-intro">
        {ko
          ? "인증된 계정이 실제로 생성한 실행만 표시합니다. 공개 예시나 합성 연구는 섞이지 않습니다."
          : "Only real runs created by the authenticated account appear here. Public examples and synthetic research are never mixed in."}
      </p>

      {!session && (
        <div className="my-research-empty not-connected">
          <LockKeyhole size={20} />
          <div>
            <h3>{ko ? "랩 계정을 연결하세요." : "Connect the lab account."}</h3>
            <p>{ko ? "위의 composer에서 연결을 확인하면 이 계정의 연구가 표시됩니다." : "Check the connection in the composer above to load this creator's research."}</p>
          </div>
        </div>
      )}
      {loading && (
        <p className="control-loading" role="status">
          <LoaderCircle className="spin" size={18} />
          {ko ? "내 비공개 연구를 불러오는 중입니다." : "Loading private research."}
        </p>
      )}
      {session && error && <p className="control-error" role="alert">{error}</p>}
      {session && loaded && runs.length === 0 && (
        <div className="my-research-empty">
          <FlaskConical size={20} />
          <div>
            <h3>{ko ? "이 계정으로 생성한 연구가 없습니다." : "No research for this account yet."}</h3>
            <p>{ko ? "위에서 첫 연구 계획을 검토하면 여기에 표시됩니다." : "Review the first research plan above and it will appear here."}</p>
          </div>
        </div>
      )}
      {session && runs.length > 0 && (
        <div className="my-research-list">
          {runs.map((run) => (
            <article key={run.run_id} className={`run-${run.status.toLowerCase()}`}>
              <div>
                <p className="my-research-meta">
                  <span>{statusLabel(run.status, ko)}</span>
                  <span>{profileLabel(run)}</span>
                  <span>{run.current_stage.replaceAll("_", " ")}</span>
                </p>
                <h3>
                  <Link href={withBasePath(`/run-control/?run_id=${encodeURIComponent(run.run_id)}`)}>
                    {run.research_question || run.run_id}
                  </Link>
                </h3>
                <p>
                  {new Date(run.updated_at).toLocaleString(locale)}
                  {` · ${Math.round(run.progress_percentage)}%`}
                </p>
              </div>
              <dl>
                <div>
                  <dt><Clock3 size={14} />{ko ? "진행률" : "Progress"}</dt>
                  <dd>{Math.round(run.progress_percentage)}%</dd>
                </div>
                <div>
                  <dt><Library size={14} />{ko ? "분석 문헌" : "Literature"}</dt>
                  <dd>{run.literature_analyzed_count}</dd>
                </div>
                <div>
                  <dt><PackageCheck size={14} />{ko ? "결과 파일" : "Artifacts"}</dt>
                  <dd>{run.artifact_availability.available ? run.artifact_availability.count : "—"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
