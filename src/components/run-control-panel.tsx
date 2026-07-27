"use client";

import {
  AlertTriangle,
  Ban,
  Check,
  CircleDot,
  Clock3,
  LoaderCircle,
  LogIn,
  Server,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { PrivateRunReader } from "@/components/private-run-reader";
import { useLocale } from "@/lib/locale";
import {
  approveControlledRun,
  cancelControlledRun,
  getControlledRun,
  getControlledRunEvents,
  getRunControlSession,
  getScientificRunner,
  redispatchControlledRun,
  runControlApiBase,
  RunControlApiError,
  type RunControlEvent,
  type RunControlRecord,
  type RunControlSession,
} from "@/lib/run-control-api";

const terminalStatuses = new Set(["COMPLETED", "FAILED", "CANCELLED", "QUEUE_EXPIRED"]);
const executionStages = [
  "scientific_framing",
  "mechanistic_decomposition",
  "idea_generation",
  "presearch_idea_freeze",
  "literature_retrieval",
  "family_grouping",
  "proposal_development",
  "skeptical_review",
  "revision",
  "portfolio_synthesis",
  "report_generation",
  "completed",
];

function hours(seconds: number) {
  return seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${Math.round(seconds / 3600)}h`;
}

function formatValue(value: unknown, ko: boolean) {
  if (typeof value === "boolean") return value ? (ko ? "예" : "Yes") : (ko ? "아니요" : "No");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
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
  const [runnerOnline, setRunnerOnline] = useState<boolean | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  const refresh = useCallback(async (id: string) => {
    try {
      const [nextRun, nextEvents, runner] = await Promise.all([
        getControlledRun(id),
        getControlledRunEvents(id),
        getScientificRunner(),
      ]);
      setRun(nextRun);
      setEvents(nextEvents);
      setRunnerOnline(runner.online);
      setError("");
    } catch (reason) {
      if (reason instanceof RunControlApiError && [401, 403].includes(reason.status)) {
        setAuthRequired(true);
      } else {
        setError(reason instanceof Error ? reason.message : "Unable to read run status.");
      }
    }
  }, []);

  useEffect(() => {
    if (!runId || !runControlApiBase) return;
    getRunControlSession()
      .then((value) => {
        setSession(value);
        setAuthRequired(false);
        return refresh(runId);
      })
      .catch((reason) => {
        if (reason instanceof RunControlApiError && [401, 403].includes(reason.status)) {
          setAuthRequired(true);
        } else {
          setError(reason instanceof Error ? reason.message : "Unable to authenticate.");
        }
      });
  }, [refresh, runId]);

  useEffect(() => {
    if (!runId || !session || terminalStatuses.has(run?.status ?? "")) return;
    const interval = window.setInterval(() => refresh(runId), 5000);
    return () => window.clearInterval(interval);
  }, [refresh, run?.status, runId, session]);

  if (!runControlApiBase) {
    return <section className="control-notice" role="status"><Server size={22} /><div><h2>{ko ? "연구 실행 기능은 준비 중입니다." : "Research execution is being prepared."}</h2><p>{ko ? "운영 백엔드 연결이 완료될 때까지 실행 요청을 보낼 수 없습니다." : "Run requests remain disabled until the production backend is connected."}</p></div></section>;
  }
  if (authRequired) {
    return <section className="control-notice"><LogIn size={22} /><div><h2>{ko ? "인증이 필요합니다." : "Authentication required"}</h2><p>{ko ? "허용된 Cloudflare Access 계정으로 인증하세요." : "Authenticate with an allowlisted Cloudflare Access account."}</p><a className="primary-button" href={`${runControlApiBase}/api/session`}><LogIn size={17} />Cloudflare Access</a></div></section>;
  }
  if (!runId) return <p className="control-error">{ko ? "실행 ID가 없습니다." : "Missing run ID."}</p>;
  if (!run) {
    return <p className="control-loading" role="status"><LoaderCircle className="spin" size={18} />{error || (ko ? "실행 상태를 불러오는 중입니다." : "Loading run status.")}</p>;
  }

  const contract = run.compiled_contract;
  const budget = contract?.budget;
  const canApprove = run.status === "AWAITING_APPROVAL" && Boolean(session);
  const canCancel = ["QUEUED", "RUNNER_OFFLINE", "PREFLIGHT", "AWAITING_APPROVAL", "RUNNING", "GENERATING_REPORTS"].includes(run.status);
  const latest = events.at(-1);
  const metrics = latest?.metrics;

  async function act(action: "approve" | "cancel") {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      setRun(action === "approve"
        ? await approveControlledRun(runId, session.csrf_token)
        : await cancelControlledRun(runId, session.csrf_token));
      setConfirmed(false);
      await refresh(runId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The request failed.");
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
        <div><p className="section-label">{ko ? "인증된 비공개 실행" : "Authenticated private run"}</p><h1>{ko ? "연구 계획과 실행 상태" : "Research plan and execution"}</h1><p className="page-lede">{run.safe_message}</p></div>
        <div className={`runner-state ${runnerOnline ? "online" : "offline"}`}><Server size={17} />{runnerOnline === null ? (ko ? "Runner 확인 중" : "Checking runner") : runnerOnline ? (ko ? "VM runner 온라인" : "VM runner online") : (ko ? "VM runner 오프라인" : "VM runner offline")}</div>
      </header>

      <section className="run-state-band">
        <div><span>{ko ? "현재 상태" : "Current status"}</span><strong>{run.status}</strong></div>
        <div><span>Run ID</span><strong>{run.run_id}</strong></div>
        <div><span>{ko ? "예산 프로필" : "Budget profile"}</span><strong>{run.budget_profile}</strong></div>
        <div><span>{ko ? "대기 만료" : "Queue expiry"}</span><strong>{new Date(run.queue_expires_at).toLocaleString(locale)}</strong></div>
      </section>

      {contract && (
        <section className="compiled-contract">
          <div className="section-heading"><div><p className="section-label">{ko ? "무비용 사전 검토" : "Zero-provider preflight"}</p><h2>{ko ? "컴파일된 연구 계획" : "Compiled research plan"}</h2></div><span>{contract.run_mode}</span></div>
          <p className="approval-boundary-note">{ko ? "실행 승인을 누르기 전에는 provider 기반 연구가 시작되지 않습니다." : "Provider-backed research does not start until you approve execution."}</p>

          <dl className="contract-grid">
            <div><dt>{ko ? "연구 모드" : "Run mode"}</dt><dd>{contract.run_mode}</dd></div>
            <div><dt>{ko ? "창의성 프로필" : "Creativity profile"}</dt><dd>{contract.creativity_profile ?? "STANDARD"}</dd></div>
            <div><dt>{ko ? "문헌 검토" : "Literature scope"}</dt><dd>{formatValue(contract.include_literature_list_and_review_scope, ko)}</dd></div>
            <div><dt>{ko ? "초기 아이디어 목표" : "Raw idea target"}</dt><dd>{contract.raw_spark_target ?? contract.generation_plan.raw_idea_target}</dd></div>
            <div><dt>{ko ? "기전 계열 목표" : "Mechanism family target"}</dt><dd>{contract.generation_plan.mechanism_family_target_range.join("–")}</dd></div>
            <div><dt>Runtime ref</dt><dd>{contract.runtime_ref}</dd></div>
            <div><dt>{ko ? "대상 runner" : "Target runner"}</dt><dd>{contract.target_runner}</dd></div>
            <div><dt>{ko ? "사용자 확인 필요" : "User confirmation required"}</dt><dd>{formatValue(contract.requires_user_confirmation, ko)}</dd></div>
          </dl>

          {contract.material_inferences.length > 0 && <div className="inference-list"><h3>{ko ? "추론·변경 사항" : "Inferred and changed fields"}</h3>{contract.material_inferences.map((item) => <div key={`${item.field}-${String(item.to)}`}><strong>{item.field}</strong><span>{formatValue(item.from, ko)} → {formatValue(item.to, ko)}</span><p>{item.reason}</p></div>)}</div>}

          {budget && <div className="budget-comparison">
            <div><span>{ko ? "호출" : "Calls"}</span><strong>{budget.expected_successful_calls}</strong><small>/ {budget.hard_cap_successful_calls} cap</small></div>
            <div><span>{ko ? "입력 토큰" : "Input tokens"}</span><strong>{budget.expected_input_tokens.toLocaleString()}</strong><small>/ {budget.hard_cap_input_tokens.toLocaleString()}</small></div>
            <div><span>{ko ? "출력 토큰" : "Output tokens"}</span><strong>{budget.expected_output_tokens.toLocaleString()}</strong><small>/ {budget.hard_cap_output_tokens.toLocaleString()}</small></div>
            <div><span>{ko ? "비용" : "Cost"}</span><strong>${budget.expected_cost_usd.toFixed(2)}</strong><small>/ ${budget.hard_cap_cost_usd.toFixed(2)}</small></div>
            <div><span>{ko ? "시간" : "Time"}</span><strong>{hours(budget.expected_wall_clock_seconds)}</strong><small>/ {hours(budget.hard_cap_wall_clock_seconds)}</small></div>
          </div>}
        </section>
      )}

      {canApprove && <section className="approval-panel"><AlertTriangle size={21} /><div><h2>{ko ? "실행 승인" : "Approve execution"}</h2><p>{ko ? "연구 범위, 추론된 변경 사항, 호출·토큰·비용·시간 상한을 확인하세요." : "Review the scope, inferred changes, and call, token, cost, and time ceilings."}</p><label><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>{ko ? "컴파일된 계획과 예산 상한을 확인했습니다." : "I reviewed the compiled plan and budget ceilings."}</span></label><div className="approval-actions"><Link className="secondary-button" href="/new-run/">{ko ? "요청 수정" : "Edit request"}</Link><button className="primary-button" type="button" disabled={!confirmed || busy} onClick={() => act("approve")}><Check size={17} />{ko ? "실행 승인" : "Approve execution"}</button></div></div></section>}

      {(run.status === "RUNNING" || run.status === "GENERATING_REPORTS" || run.status === "COMPLETED") && (
        <section className="execution-progress">
          <div className="section-heading"><div><p className="section-label">{ko ? "실행과 결과" : "Execution and results"}</p><h2>{ko ? "연구 진행 단계" : "Research stage progress"}</h2></div><span>{latest ? `${Math.round(latest.progress * 100)}%` : "0%"}</span></div>
          <ol className="stage-progress-list">{executionStages.map((stage) => {
            const event = [...events].reverse().find((item) => item.stage === stage);
            const active = latest?.stage === stage;
            return <li key={stage} className={active ? "active" : event ? "complete" : ""}>{event ? <Check size={15} /> : <CircleDot size={15} />}<span>{stage.replaceAll("_", " ")}</span></li>;
          })}</ol>
          {latest && <div className="live-run-metrics">
            <div><span>{ko ? "초기 아이디어" : "Raw ideas"}</span><strong>{metrics?.raw_ideas ?? "—"}</strong></div>
            <div><span>{ko ? "독립 아이디어" : "Independent ideas"}</span><strong>{metrics?.independent_ideas ?? "—"}</strong></div>
            <div><span>{ko ? "기전 계열" : "Families"}</span><strong>{metrics?.families ?? "—"}</strong></div>
            <div><span>{ko ? "발전 제안" : "Developed proposals"}</span><strong>{metrics?.developed_proposals ?? "—"}</strong></div>
            <div><span>{ko ? "분석 문헌" : "Literature analyzed"}</span><strong>{metrics?.literature_analyzed ?? "—"}</strong></div>
            <div><span>{ko ? "인용 출처" : "Sources cited"}</span><strong>{metrics?.sources_cited ?? "—"}</strong></div>
            <div><span>{ko ? "Provider 비용" : "Provider cost"}</span><strong>${latest.cumulative_usage.cost_usd.toFixed(2)}</strong></div>
            <div><span>{ko ? "경과 시간" : "Elapsed"}</span><strong>{metrics?.elapsed_seconds !== undefined ? hours(metrics.elapsed_seconds) : "—"}</strong></div>
          </div>}
        </section>
      )}

      <section className="event-timeline">
        <div className="section-heading"><div><p className="section-label">{ko ? "안전한 상태 기록" : "Safe status record"}</p><h2>{ko ? "이벤트" : "Events"}</h2></div><span>{events.length}</span></div>
        {events.length === 0 ? <p className="muted-text">{ko ? "아직 수신된 이벤트가 없습니다." : "No events received yet."}</p> : events.map((event, index) => <div className="event-row" key={event.event_id}><span className="event-marker">{index === events.length - 1 ? <CircleDot size={17} /> : <Check size={15} />}</span><div><strong>{event.stage.replaceAll("_", " ")}</strong><p>{event.message}</p></div><span>{Math.round(event.progress * 100)}%</span></div>)}
      </section>

      {run.status === "COMPLETED" && <PrivateRunReader runId={runId} />}

      <div className="run-control-actions">
        {run.status === "QUEUE_EXPIRED" && <button className="primary-button" type="button" disabled={busy} onClick={async () => { if (!session) return; setBusy(true); try { setRun(await redispatchControlledRun(runId, session.csrf_token)); } catch (reason) { setError(reason instanceof Error ? reason.message : "The request failed."); } finally { setBusy(false); } }}><Clock3 size={17} />{ko ? "만료된 실행 다시 전송" : "Re-dispatch expired run"}</button>}
        {canCancel && <button className="secondary-button danger-action" type="button" disabled={busy} onClick={() => act("cancel")}><Ban size={17} />{ko ? "실행 취소" : "Cancel run"}</button>}
        <button className="secondary-button" type="button" disabled={busy} onClick={() => refresh(runId)}><LoaderCircle size={17} />{ko ? "상태 새로고침" : "Refresh status"}</button>
      </div>
      {error && <p className="control-error" role="alert">{error}</p>}
    </div>
  );
}
