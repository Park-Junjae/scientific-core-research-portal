"use client";

import {
  Ban,
  Check,
  CircleDot,
  LoaderCircle,
  Server,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AccessConnectionPanel } from "@/components/access-connection-panel";
import { PrivateRunReader } from "@/components/private-run-reader";
import { useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import { compactResearchTitle } from "@/lib/research-title";
import {
  cancelControlledRun,
  getControlledRun,
  getControlledRunEvents,
  getRunControlSession,
  RUN_STATUS_POLL_INTERVAL_MS,
  runControlApiBase,
  RunControlApiError,
  type RunControlEvent,
  type RunControlRecord,
  type RunControlSession,
  type RunControlStatus,
} from "@/lib/run-control-api";

const terminalStatuses = new Set<RunControlStatus>([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "QUEUE_EXPIRED",
]);

interface SubmittedRunSummary {
  research_question: string;
  objectives: string[];
  constraints: string[];
  selected_mode: string;
  creativity_profile: string;
  literature_scope: boolean;
  report_language: string;
}

const executionStages = [
  ["runner_accepted"],
  ["scientific_framing"],
  ["mechanistic_decomposition"],
  ["blind_multi_lens_ideation"],
  ["presearch_idea_freeze"],
  ["literature_retrieval"],
  ["novelty_and_precedent_audit"],
  ["idea_generation"],
  ["mechanism_family_grouping", "family_grouping"],
  ["proposal_development", "scientific_development"],
  ["skeptical_review"],
  ["revision"],
  ["dual_axis_portfolio"],
  ["comparison", "synthesis"],
  ["report_generation"],
  ["publication_packaging"],
  ["completed", "failed", "cancelled"],
] as const;

function hours(seconds: number) {
  return seconds < 3600
    ? `${Math.round(seconds / 60)}m`
    : `${Math.round(seconds / 3600)}h`;
}

function statusLabel(status: RunControlStatus, ko: boolean) {
  const labels: Partial<Record<RunControlStatus, [string, string]>> = {
    STARTING: ["시작 중", "Starting"],
    QUEUED: ["대기 중", "Queued"],
    RUNNING: ["연구 진행 중", "Running"],
    GENERATING_REPORTS: ["결과 작성 중", "Generating reports"],
    COMPLETED: ["완료", "Completed"],
    FAILED: ["실패", "Failed"],
    CANCELLED: ["취소됨", "Cancelled"],
    QUEUE_EXPIRED: ["대기 만료", "Queue expired"],
  };
  const value = labels[status] ?? [status, status];
  return ko ? value[0] : value[1];
}

function statusError(error: unknown, ko: boolean) {
  if (error instanceof RunControlApiError && error.kind === "RATE_LIMITED") {
    const seconds = Math.max(1, Math.ceil(error.retryAfterMs / 1000));
    return ko
      ? `요청 한도에 도달했습니다. ${seconds}초 후 자동으로 다시 확인합니다.`
      : `The request limit was reached. Automatic refresh resumes in ${seconds} seconds.`;
  }
  return error instanceof Error
    ? error.message
    : ko
      ? "연구 상태를 불러올 수 없습니다."
      : "Unable to read research status.";
}

export function RunControlPanel() {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const runId = useSyncExternalStore(
    () => () => undefined,
    () => new URLSearchParams(window.location.search).get("run_id") ?? "",
    () => "",
  );
  const createdMarker = useSyncExternalStore(
    () => () => undefined,
    () => new URLSearchParams(window.location.search).get("created") ?? "",
    () => "",
  );
  const [session, setSession] = useState<RunControlSession | null>(null);
  const [run, setRun] = useState<RunControlRecord | null>(null);
  const [events, setEvents] = useState<RunControlEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdNotice, setCreatedNotice] = useState(false);
  const stageRef = useRef("");
  const backoffUntilRef = useRef(0);

  const submitted = useMemo(() => {
    if (!runId || typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(
        `scientific-core-run-draft:${runId}`,
      );
      return raw ? JSON.parse(raw) as SubmittedRunSummary : null;
    } catch {
      return null;
    }
  }, [runId]);

  const refresh = useCallback(async (id: string, includeEvents = false) => {
    if (!includeEvents && Date.now() < backoffUntilRef.current) return;
    try {
      const nextRun = await getControlledRun(id);
      const stageChanged = Boolean(stageRef.current)
        && stageRef.current !== nextRun.current_stage;
      setRun(nextRun);
      if (includeEvents || stageChanged) {
        setEvents(await getControlledRunEvents(id));
      }
      stageRef.current = nextRun.current_stage;
      backoffUntilRef.current = 0;
      setError("");
    } catch (reason) {
      if (reason instanceof RunControlApiError && reason.kind === "RATE_LIMITED") {
        backoffUntilRef.current = Date.now() + Math.max(
          reason.retryAfterMs,
          RUN_STATUS_POLL_INTERVAL_MS,
        );
      }
      if (
        reason instanceof RunControlApiError
        && ["ACCESS_CHALLENGE", "BACKEND_UNAUTHENTICATED", "NOT_ALLOWLISTED"].includes(
          reason.kind,
        )
      ) {
        setSession(null);
      }
      setError(statusError(reason, ko));
    }
  }, [ko]);

  const connected = useCallback(async (
    nextSession: RunControlSession | null,
  ) => {
    if (!nextSession) {
      setSession(null);
      return;
    }
    setSession(nextSession);
    setError("");
    if (runId) await refresh(runId, true);
  }, [refresh, runId]);

  useEffect(() => {
    if (!runId || createdMarker !== "1") return;
    const frame = window.requestAnimationFrame(() => setCreatedNotice(true));
    return () => window.cancelAnimationFrame(frame);
  }, [createdMarker, runId]);

  useEffect(() => {
    let active = true;
    if (!runId) return () => { active = false; };
    void getRunControlSession()
      .then(async (nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setError("");
        await refresh(runId, true);
      })
      .catch((reason) => {
        if (active) setError(statusError(reason, ko));
      });
    return () => { active = false; };
  }, [ko, refresh, runId]);

  useEffect(() => {
    if (!runId || !session || terminalStatuses.has(run?.status ?? "STARTING")) {
      return;
    }
    const interval = window.setInterval(() => {
      if (Date.now() >= backoffUntilRef.current) void refresh(runId);
    }, RUN_STATUS_POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refresh, run?.status, runId, session]);

  if (!runControlApiBase) {
    return (
      <section className="control-notice" role="status">
        <Server size={22} />
        <div>
          <h2>{ko ? "연구 실행 기능을 준비하고 있습니다." : "Research execution is being prepared."}</h2>
          <p>{ko ? "운영 Backend 연결이 완료될 때까지 연구를 시작할 수 없습니다." : "Research cannot start until the production Backend is connected."}</p>
        </div>
      </section>
    );
  }
  if (!runId) {
    return <p className="control-error">{ko ? "연구 ID가 없습니다." : "Missing Run ID."}</p>;
  }
  if (!session) {
    return (
      <>
        <AccessConnectionPanel onSessionChange={connected} />
        {error && <p className="control-error" role="alert">{error}</p>}
      </>
    );
  }
  if (!run) {
    return (
      <p className="control-loading" role="status">
        <LoaderCircle className="spin" size={18} />
        {error || (ko ? "연구 상태를 불러오는 중입니다." : "Loading research status.")}
      </p>
    );
  }

  const currentSession = session;
  const fullResearchGoal = run.research_question
    || submitted?.research_question
    || "";
  const projectTitle = run.display_title?.trim()
    || compactResearchTitle(fullResearchGoal)
    || run.run_id;
  const canCancel = [
    "STARTING",
    "QUEUED",
    "RUNNING",
    "GENERATING_REPORTS",
  ].includes(run.status);
  const currentStageIndex = executionStages.findIndex((aliases) =>
    aliases.some((stage) => stage === run.current_stage));

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      await cancelControlledRun(runId, currentSession.csrf_token);
      await refresh(runId, true);
    } catch (reason) {
      setError(statusError(reason, ko));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="run-control-layout">
      {createdNotice && (
        <div className="created-run-notice" role="status" aria-live="polite">
          <LoaderCircle className="spin" size={18} />
          <span>{ko ? "연구를 시작하고 있습니다." : "Starting research."}</span>
        </div>
      )}

      <header className="run-control-header">
        <div>
          <p className="section-label">{ko ? "비공개 연구" : "Private research"}</p>
          <h1>{projectTitle}</h1>
          <p className="page-lede">{run.safe_message}</p>
          <Link
            className="run-control-return"
            href={withBasePath(`/?lang=${locale}#my-research-heading`)}
          >
            ← My Research
          </Link>
        </div>
      </header>

      <section className="run-state-band direct-lifecycle">
        <div>
          <span>{ko ? "현재 상태" : "Status"}</span>
          <strong>{statusLabel(run.status, ko)}</strong>
        </div>
        <div>
          <span>{ko ? "진행률" : "Progress"}</span>
          <strong>{Math.round(run.progress_percentage)}%</strong>
        </div>
        <div>
          <span>{ko ? "연구 모드" : "Research mode"}</span>
          <strong>
            {run.creativity_profile === "BREAKTHROUGH_DISCOVERY"
              ? "Breakthrough Discovery"
              : "Standard"}
          </strong>
        </div>
      </section>

      {fullResearchGoal && (
        <section
          className="research-goal-section"
          aria-labelledby="research-goal-heading"
        >
          <h2 id="research-goal-heading">Research goal</h2>
          <p>{fullResearchGoal}</p>
        </section>
      )}

      {["STARTING", "QUEUED"].includes(run.status) && (
        <section className="execution-progress launch-progress" role="status">
          <div className="section-heading">
            <div>
              <p className="section-label">{ko ? "연구 준비" : "Research launch"}</p>
              <h2>{statusLabel(run.status, ko)}</h2>
            </div>
            <LoaderCircle className="spin" size={22} />
          </div>
          <p>{run.safe_message}</p>
        </section>
      )}

      {["RUNNING", "GENERATING_REPORTS", "COMPLETED"].includes(run.status) && (
        <section className="execution-progress">
          <div className="section-heading">
            <div>
              <p className="section-label">{ko ? "실행 및 결과" : "Execution and results"}</p>
              <h2>{ko ? "연구 진행" : "Research progress"}</h2>
            </div>
            <span>{Math.round(run.progress_percentage)}%</span>
          </div>
          <ol className="stage-progress-list">
            {executionStages.map((aliases, index) => {
              const event = [...events].reverse().find((item) =>
                aliases.some((stage) => stage === item.stage));
              const active = aliases.some((stage) => stage === run.current_stage);
              const complete = Boolean(event)
                || (currentStageIndex >= 0 && index < currentStageIndex);
              return (
                <li
                  key={aliases[0]}
                  className={active ? "active" : complete ? "complete" : ""}
                >
                  {complete && !active
                    ? <Check size={15} />
                    : <CircleDot size={15} />}
                  <span>{aliases[0].replaceAll("_", " ")}</span>
                </li>
              );
            })}
          </ol>
          <div className="live-run-metrics">
            <div><span>{ko ? "초기 아이디어" : "Raw ideas"}</span><strong>{run.raw_idea_count}</strong></div>
            <div><span>{ko ? "독립 아이디어" : "Independent ideas"}</span><strong>{run.independent_idea_count}</strong></div>
            <div><span>{ko ? "기전 계열" : "Families"}</span><strong>{run.family_count}</strong></div>
            <div><span>{ko ? "발전 제안" : "Developed proposals"}</span><strong>{run.developed_proposal_count}</strong></div>
            <div><span>{ko ? "분석 문헌" : "Literature analyzed"}</span><strong>{run.literature_analyzed_count}</strong></div>
            <div><span>{ko ? "인용 출처" : "Sources cited"}</span><strong>{run.cited_source_count}</strong></div>
            <div><span>{ko ? "Provider 비용" : "Provider cost"}</span><strong>${run.provider_cost_usd.toFixed(2)}</strong></div>
            <div><span>{ko ? "경과 시간" : "Elapsed"}</span><strong>{hours(run.elapsed_time_seconds)}</strong></div>
          </div>
        </section>
      )}

      {run.status === "COMPLETED" && <PrivateRunReader runId={runId} />}

      <details className="technical-details run-diagnostics">
        <summary>{ko ? "진단 정보" : "Diagnostics"}</summary>
        <dl className="contract-grid">
          <div><dt>Run ID</dt><dd>{run.run_id}</dd></div>
          <div><dt>{ko ? "현재 단계" : "Current stage"}</dt><dd>{run.current_stage.replaceAll("_", " ")}</dd></div>
          <div><dt>{ko ? "예산 프로필" : "Budget profile"}</dt><dd>{run.budget_profile}</dd></div>
          <div><dt>Runtime</dt><dd>{run.runtime_ref}</dd></div>
          <div><dt>{ko ? "취소 상태" : "Cancellation"}</dt><dd>{run.cancellation_state}</dd></div>
          <div><dt>{ko ? "이벤트" : "Events"}</dt><dd>{events.length}</dd></div>
        </dl>
      </details>

      {canCancel && (
        <div className="run-control-actions">
          <button
            className="secondary-button danger-action"
            type="button"
            disabled={busy}
            onClick={() => void cancel()}
          >
            <Ban size={17} />
            {ko ? "연구 취소" : "Cancel research"}
          </button>
        </div>
      )}
      {error && <p className="control-error" role="alert">{error}</p>}
    </div>
  );
}
