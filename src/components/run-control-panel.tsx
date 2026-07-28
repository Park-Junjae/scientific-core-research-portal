"use client";

import {
  AlertTriangle,
  Ban,
  Check,
  CircleDot,
  Clock3,
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
import {
  approveControlledRun,
  cancelControlledRun,
  getControlledRun,
  getControlledRunEvents,
  getRunControlSession,
  redispatchControlledRun,
  RUN_STATUS_POLL_INTERVAL_MS,
  runControlApiBase,
  RunControlApiError,
  type RunControlEvent,
  type RunControlRecord,
  type RunControlSession,
} from "@/lib/run-control-api";

const terminalStatuses = new Set(["COMPLETED", "FAILED", "CANCELLED", "QUEUE_EXPIRED"]);

interface SubmittedRunSummary {
  research_question: string;
  objectives: string[];
  constraints: string[];
  selected_mode: string;
  creativity_profile: string;
  literature_scope: boolean;
  report_language: string;
  runtime_ref: string;
}

const executionStages = [
  ["runner_accepted"],
  ["source_preflight"],
  ["scientific_framing"],
  ["mechanistic_decomposition"],
  ["blind_multi_lens_ideation"],
  ["presearch_idea_freeze"],
  ["literature_retrieval"],
  ["novelty_and_precedent_audit"],
  ["idea_generation"],
  ["mechanism_family_grouping", "family_grouping"],
  ["proposal_development"],
  ["scientific_development"],
  ["skeptical_review"],
  ["revision"],
  ["dual_axis_portfolio"],
  ["comparison"],
  ["synthesis"],
  ["report_generation"],
  ["publication_packaging"],
  ["completed", "failed", "cancelled"],
] as const;

function hours(seconds: number) {
  return seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${Math.round(seconds / 3600)}h`;
}

function formatValue(value: unknown, ko: boolean) {
  if (typeof value === "boolean") return value ? (ko ? "예" : "Yes") : (ko ? "아니요" : "No");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function statusError(error: unknown, ko: boolean) {
  if (error instanceof RunControlApiError && error.kind === "RATE_LIMITED") {
    const seconds = Math.max(1, Math.ceil(error.retryAfterMs / 1000));
    return ko
      ? `요청 한도에 도달했습니다. ${seconds}초 동안 자동 새로고침을 멈춥니다.`
      : `The request limit was reached. Automatic refresh is paused for ${seconds} seconds.`;
  }
  return error instanceof Error
    ? error.message
    : ko
      ? "실행 상태를 불러올 수 없습니다."
      : "Unable to read run status.";
}

export function RunControlPanel() {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const runId = useSyncExternalStore(
    () => () => undefined,
    () => new URLSearchParams(window.location.search).get("run_id") ?? "",
    () => "",
  );
  const [session, setSession] = useState<RunControlSession | null>(null);
  const [run, setRun] = useState<RunControlRecord | null>(null);
  const [events, setEvents] = useState<RunControlEvent[]>([]);
  const submitted = useMemo(() => {
    if (!runId || typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(`scientific-core-run-draft:${runId}`);
      return raw ? JSON.parse(raw) as SubmittedRunSummary : null;
    } catch {
      return null;
    }
  }, [runId]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const stageRef = useRef("");
  const backoffUntilRef = useRef(0);

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

  async function connected(nextSession: RunControlSession) {
    setSession(nextSession);
    setError("");
    if (runId) await refresh(runId, true);
  }

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
    if (!runId || !session || terminalStatuses.has(run?.status ?? "")) return;
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
          <h2>{ko ? "연구 실행 기능은 준비 중입니다." : "Research execution is being prepared."}</h2>
          <p>{ko ? "운영 백엔드 연결이 완료될 때까지 실행 요청을 보낼 수 없습니다." : "Run requests remain disabled until the production backend is connected."}</p>
        </div>
      </section>
    );
  }
  if (!runId) {
    return <p className="control-error">{ko ? "실행 ID가 없습니다." : "Missing run ID."}</p>;
  }
  if (!session) {
    return (
      <>
        <AccessConnectionPanel onConnected={connected} />
        {error && <p className="control-error" role="alert">{error}</p>}
      </>
    );
  }
  if (!run) {
    return (
      <p className="control-loading" role="status">
        <LoaderCircle className="spin" size={18} />
        {error || (ko ? "실행 상태를 불러오는 중입니다." : "Loading run status.")}
      </p>
    );
  }
  const currentSession = session;

  const contract = run.compiled_contract;
  const budget = contract?.budget;
  const canApprove = run.status === "AWAITING_APPROVAL";
  const canCancel = [
    "QUEUED",
    "RUNNER_OFFLINE",
    "PREFLIGHT",
    "AWAITING_APPROVAL",
    "RUNNING",
    "GENERATING_REPORTS",
  ].includes(run.status);
  const latest = events.at(-1);
  const currentStageIndex = executionStages.findIndex((aliases) =>
    aliases.some((stage) => stage === run.current_stage));
  const queueExpiry = run.queue_expires_at || run.queue_expiry || "";

  async function act(action: "approve" | "cancel") {
    setBusy(true);
    setError("");
    try {
      if (action === "approve") {
        await approveControlledRun(runId, currentSession.csrf_token);
      } else {
        await cancelControlledRun(runId, currentSession.csrf_token);
      }
      setConfirmed(false);
      await refresh(runId, true);
    } catch (reason) {
      setError(statusError(reason, ko));
    } finally {
      setBusy(false);
    }
  }

  async function redispatch() {
    setBusy(true);
    setError("");
    try {
      await redispatchControlledRun(runId, currentSession.csrf_token);
      await refresh(runId, true);
    } catch (reason) {
      setError(statusError(reason, ko));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="run-control-layout">
      <div className="workflow-steps" aria-label={ko ? "연구 실행 단계" : "Research workflow"}>
        <span>1. {ko ? "요청" : "Request"}</span>
        <strong>2. {ko ? "사전 검토" : "Preflight review"}</strong>
        <span>3. {ko ? "승인·실행·결과" : "Approval, execution, results"}</span>
      </div>

      <header className="run-control-header">
        <div>
          <p className="section-label">{ko ? "인증된 비공개 실행" : "Authenticated private run"}</p>
          <h1>{ko ? "연구 계획과 실행 상태" : "Research plan and execution"}</h1>
          <p className="page-lede">{run.safe_message}</p>
        </div>
        <div className={`runner-state ${run.runner_state === "ONLINE" ? "online" : "offline"}`}>
          <Server size={17} />
          {run.runner_state === "ONLINE"
            ? (ko ? "VM runner 온라인" : "VM runner online")
            : (ko ? "VM runner 오프라인" : "VM runner offline")}
        </div>
      </header>

      <section className="run-state-band">
        <div><span>{ko ? "현재 상태" : "Current status"}</span><strong>{run.status}</strong></div>
        <div><span>Run ID</span><strong>{run.run_id}</strong></div>
        <div><span>{ko ? "현재 단계" : "Current stage"}</span><strong>{run.current_stage.replaceAll("_", " ")}</strong></div>
        <div><span>{ko ? "예산 프로필" : "Budget profile"}</span><strong>{run.budget_profile}</strong></div>
        <div><span>{ko ? "취소 상태" : "Cancellation"}</span><strong>{run.cancellation_state}</strong></div>
        <div><span>{ko ? "대기 만료" : "Queue expiry"}</span><strong>{queueExpiry ? new Date(queueExpiry).toLocaleString(locale) : "—"}</strong></div>
      </section>

      {submitted && (
        <section className="submitted-request-summary">
          <div className="section-heading">
            <div>
              <p className="section-label">{ko ? "제출한 비공개 요청" : "Submitted private request"}</p>
              <h2>{ko ? "연구 범위 확인" : "Research scope review"}</h2>
            </div>
            <span>{submitted.creativity_profile === "BREAKTHROUGH_DISCOVERY" ? "Breakthrough Discovery" : "Standard"}</span>
          </div>
          <dl className="contract-grid">
            <div className="wide"><dt>{ko ? "정규화된 연구 질문" : "Normalized research question"}</dt><dd>{submitted.research_question}</dd></div>
            <div><dt>{ko ? "선택 모드" : "Selected mode"}</dt><dd>{submitted.selected_mode}</dd></div>
            <div><dt>{ko ? "보고서 언어" : "Report language"}</dt><dd>{submitted.report_language}</dd></div>
            <div><dt>{ko ? "문헌 범위" : "Literature scope"}</dt><dd>{formatValue(submitted.literature_scope, ko)}</dd></div>
            <div><dt>Runtime</dt><dd>{submitted.runtime_ref}</dd></div>
          </dl>
          <div className="submitted-request-lists">
            <div><h3>{ko ? "목표" : "Objectives"}</h3><ul>{submitted.objectives.length ? submitted.objectives.map((item) => <li key={item}>{item}</li>) : <li>—</li>}</ul></div>
            <div><h3>{ko ? "제약" : "Constraints"}</h3><ul>{submitted.constraints.length ? submitted.constraints.map((item) => <li key={item}>{item}</li>) : <li>—</li>}</ul></div>
          </div>
        </section>
      )}

      {["QUEUED", "RUNNER_OFFLINE", "PREFLIGHT"].includes(run.status) && (
        <section className="preflight-progress">
          <LoaderCircle className="spin" size={22} />
          <div>
            <p className="section-label">{ko ? "무비용 사전 검토 진행 중" : "Zero-provider preflight in progress"}</p>
            <h2>{ko ? "계획을 컴파일하고 있습니다" : "Compiling the research plan"}</h2>
            <p>{ko ? "질문, 모드, 문헌 범위, runtime과 예산 상한을 검증합니다. Provider 사용량은 0입니다." : "Validating the question, mode, literature scope, runtime, and budget ceilings. Provider usage remains zero."}</p>
            <div className="preflight-progress-bar"><span style={{ width: `${Math.max(4, run.progress_percentage)}%` }} /></div>
          </div>
          <strong>0 calls · 0 tokens · USD 0</strong>
        </section>
      )}

      {contract && (
        <section className="compiled-contract">
          <div className="section-heading">
            <div><p className="section-label">{ko ? "무비용 사전 검토" : "Zero-provider preflight"}</p><h2>{ko ? "컴파일된 연구 계획" : "Compiled research plan"}</h2></div>
            <span>{contract.run_mode}</span>
          </div>
          <p className="approval-boundary-note">{ko ? "실행 승인을 누르기 전에는 provider 기반 연구가 시작되지 않습니다." : "Provider-backed research does not start until you approve execution."}</p>

          <dl className="contract-grid">
            <div><dt>{ko ? "연구 모드" : "Run mode"}</dt><dd>{contract.run_mode}</dd></div>
            <div><dt>{ko ? "창의성 프로필" : "Creativity profile"}</dt><dd>{contract.creativity_profile ?? "STANDARD"}</dd></div>
            <div><dt>{ko ? "문헌 검토" : "Literature scope"}</dt><dd>{formatValue(contract.include_literature_list_and_review_scope, ko)}</dd></div>
            <div><dt>{ko ? "보고서 언어" : "Report language"}</dt><dd>{contract.reporting.language_priority}</dd></div>
            <div><dt>{ko ? "초기 아이디어 목표" : "Raw idea target"}</dt><dd>{contract.raw_spark_target ?? contract.generation_plan.raw_idea_target}</dd></div>
            <div><dt>{ko ? "기전 계열 목표" : "Mechanism family target"}</dt><dd>{contract.generation_plan.mechanism_family_target_range.join("–")}</dd></div>
            <div><dt>Runtime ref</dt><dd>{contract.runtime_ref}</dd></div>
            <div><dt>{ko ? "대상 runner" : "Target runner"}</dt><dd>{contract.target_runner}</dd></div>
            <div><dt>{ko ? "사용자 확인 필요" : "User confirmation required"}</dt><dd>{formatValue(contract.requires_user_confirmation, ko)}</dd></div>
          </dl>

          {contract.stage_order && contract.stage_order.length > 0 && (
            <div className="contract-stage-order">
              <h3>{ko ? "승인된 단계 순서" : "Approved stage order"}</h3>
              <ol>{contract.stage_order.map((stage) => <li key={stage}>{stage.replaceAll("_", " ")}</li>)}</ol>
            </div>
          )}

          {contract.material_inferences.length > 0 && (
            <div className="inference-list">
              <h3>{ko ? "추론·변경 사항" : "Inferred and changed fields"}</h3>
              {contract.material_inferences.map((item) => (
                <div key={`${item.field}-${String(item.to)}`}>
                  <strong>{item.field}</strong>
                  <span>{formatValue(item.from, ko)} → {formatValue(item.to, ko)}</span>
                  <p>{item.reason}</p>
                </div>
              ))}
            </div>
          )}

          {budget && (
            <div className="budget-comparison">
              <div><span>{ko ? "호출" : "Calls"}</span><strong>{budget.expected_successful_calls}</strong><small>/ {budget.hard_cap_successful_calls} cap</small></div>
              <div><span>{ko ? "입력 토큰" : "Input tokens"}</span><strong>{budget.expected_input_tokens.toLocaleString()}</strong><small>/ {budget.hard_cap_input_tokens.toLocaleString()}</small></div>
              <div><span>{ko ? "출력 토큰" : "Output tokens"}</span><strong>{budget.expected_output_tokens.toLocaleString()}</strong><small>/ {budget.hard_cap_output_tokens.toLocaleString()}</small></div>
              <div><span>{ko ? "비용" : "Cost"}</span><strong>${budget.expected_cost_usd.toFixed(2)}</strong><small>/ ${budget.hard_cap_cost_usd.toFixed(2)}</small></div>
              <div><span>{ko ? "시간" : "Time"}</span><strong>{hours(budget.expected_wall_clock_seconds)}</strong><small>/ {hours(budget.hard_cap_wall_clock_seconds)}</small></div>
            </div>
          )}
        </section>
      )}

      {canApprove && (
        <section className="approval-panel">
          <AlertTriangle size={21} />
          <div>
            <h2>{ko ? "내 실행 승인" : "Approve my execution"}</h2>
            <p>{ko ? "연구 범위, 추론된 변경 사항, 호출·토큰·비용·시간 상한을 확인하세요." : "Review the scope, inferred changes, and call, token, cost, and time ceilings."}</p>
            <label>
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>{ko ? "컴파일된 계획과 예산 상한을 확인했습니다." : "I reviewed the compiled plan and budget ceilings."}</span>
            </label>
            <div className="approval-actions">
              <Link className="secondary-button" href={withBasePath(`/?lang=${locale}`)}>{ko ? "요청 수정" : "Edit request"}</Link>
              <button className="primary-button" type="button" disabled={!confirmed || busy} onClick={() => act("approve")}>
                <Check size={17} />{ko ? "내 실행 승인" : "Approve my execution"}
              </button>
            </div>
          </div>
        </section>
      )}

      {(run.status === "RUNNING" || run.status === "GENERATING_REPORTS" || run.status === "COMPLETED") && (
        <section className="execution-progress">
          <div className="section-heading">
            <div><p className="section-label">{ko ? "실행과 결과" : "Execution and results"}</p><h2>{ko ? "연구 진행 단계" : "Research stage progress"}</h2></div>
            <span>{Math.round(run.progress_percentage)}%</span>
          </div>
          <ol className="stage-progress-list">
            {executionStages.map((aliases, index) => {
              const event = [...events].reverse().find((item) =>
                aliases.some((stage) => stage === item.stage));
              const active = aliases.some((stage) => stage === run.current_stage);
              const complete = Boolean(event) || (currentStageIndex >= 0 && index < currentStageIndex);
              return (
                <li key={aliases[0]} className={active ? "active" : complete ? "complete" : ""}>
                  {complete && !active ? <Check size={15} /> : <CircleDot size={15} />}
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

      <section className="event-timeline">
        <div className="section-heading">
          <div><p className="section-label">{ko ? "안전한 상태 기록" : "Safe status record"}</p><h2>{ko ? "이벤트" : "Events"}</h2></div>
          <span>{events.length}</span>
        </div>
        {events.length === 0
          ? <p className="muted-text">{ko ? "아직 수신된 이벤트가 없습니다." : "No events received yet."}</p>
          : events.map((event, index) => (
              <div className="event-row" key={event.event_id}>
                <span className="event-marker">{index === events.length - 1 ? <CircleDot size={17} /> : <Check size={15} />}</span>
                <div><strong>{event.stage.replaceAll("_", " ")}</strong><p>{event.message}</p></div>
                <span>{Math.round(event.progress * 100)}%</span>
              </div>
            ))}
      </section>

      {run.status === "COMPLETED" && <PrivateRunReader runId={runId} />}

      <div className="run-control-actions">
        {run.status === "QUEUE_EXPIRED" && (
          <button className="primary-button" type="button" disabled={busy} onClick={redispatch}>
            <Clock3 size={17} />{ko ? "만료된 실행 다시 전송" : "Re-dispatch expired run"}
          </button>
        )}
        {canCancel && (
          <button className="secondary-button danger-action" type="button" disabled={busy} onClick={() => act("cancel")}>
            <Ban size={17} />{ko ? "실행 취소" : "Cancel run"}
          </button>
        )}
        <button className="secondary-button" type="button" disabled={busy} onClick={() => refresh(runId, true)}>
          <LoaderCircle size={17} />{ko ? "상태 새로고침" : "Refresh status"}
        </button>
      </div>
      {error && <p className="control-error" role="alert">{error}</p>}
      {latest && <span className="sr-only">{latest.stage}</span>}
    </div>
  );
}
