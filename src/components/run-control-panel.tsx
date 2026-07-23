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
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
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

function formatValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "-";
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
      if (reason instanceof RunControlApiError && reason.status === 401) {
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
        if (reason instanceof RunControlApiError && reason.status === 401) {
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

  const authUrl = runControlApiBase
    ? `${runControlApiBase}/auth/github?return_to=${encodeURIComponent(
        typeof window === "undefined" ? "" : window.location.href,
      )}`
    : "#";

  if (!runControlApiBase) {
    return (
      <section className="control-notice" role="status">
        <Server size={22} />
        <div>
          <h2>{ko ? "실행 백엔드 설정 필요" : "Run backend configuration required"}</h2>
          <p>
            {ko
              ? "배포 환경에 NEXT_PUBLIC_RUN_CONTROL_API_BASE를 설정하면 이 화면에서 직접 실행을 제어할 수 있습니다."
              : "Set NEXT_PUBLIC_RUN_CONTROL_API_BASE in the deployment environment to enable direct run control."}
          </p>
        </div>
      </section>
    );
  }

  if (authRequired) {
    return (
      <section className="control-notice">
        <LogIn size={22} />
        <div>
          <h2>{ko ? "인증이 필요합니다" : "Authentication required"}</h2>
          <p>{ko ? "허용된 GitHub 계정으로 로그인하세요." : "Sign in with an allowlisted GitHub account."}</p>
          <a className="primary-button" href={authUrl}>
            <LogIn size={17} /> {ko ? "GitHub로 로그인" : "Sign in with GitHub"}
          </a>
        </div>
      </section>
    );
  }

  if (!runId) {
    return <p className="control-error">{ko ? "run_id가 없습니다." : "Missing run_id."}</p>;
  }

  if (!run) {
    return (
      <p className="control-loading" role="status">
        <LoaderCircle className="spin" size={18} />
        {error || (ko ? "실행 상태를 불러오는 중입니다." : "Loading run status.")}
      </p>
    );
  }

  const contract = run.compiled_contract;
  const canApprove = run.status === "AWAITING_APPROVAL" && Boolean(session);
  const canCancel = ["QUEUED", "RUNNER_OFFLINE", "PREFLIGHT", "AWAITING_APPROVAL", "RUNNING", "GENERATING_REPORTS"].includes(run.status);
  const budget = contract?.budget;

  async function act(action: "approve" | "cancel") {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const updated = action === "approve"
        ? await approveControlledRun(runId, session.csrf_token)
        : await cancelControlledRun(runId, session.csrf_token);
      setRun(updated);
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
      <header className="run-control-header">
        <div>
          <p className="section-label">{ko ? "인증된 직접 실행" : "Authenticated direct run"}</p>
          <h1>{ko ? "연구 실행 제어" : "Research run control"}</h1>
          <p className="page-lede">{run.safe_message}</p>
        </div>
        <div className={`runner-state ${runnerOnline ? "online" : "offline"}`}>
          <Server size={17} />
          {runnerOnline === null
            ? (ko ? "Runner 확인 중" : "Checking runner")
            : runnerOnline
              ? (ko ? "VM Runner 온라인" : "VM runner online")
              : (ko ? "VM Runner 오프라인" : "VM runner offline")}
        </div>
      </header>

      <section className="run-state-band">
        <div>
          <span>{ko ? "현재 상태" : "Current status"}</span>
          <strong>{run.status}</strong>
        </div>
        <div>
          <span>Run ID</span>
          <strong>{run.run_id}</strong>
        </div>
        <div>
          <span>{ko ? "예산 프로필" : "Budget profile"}</span>
          <strong>{run.budget_profile}</strong>
        </div>
        <div>
          <span>{ko ? "대기 시작" : "Queued at"}</span>
          <strong>{new Date(run.created_at).toLocaleString(locale)}</strong>
        </div>
        <div>
          <span>{ko ? "요청 만료" : "Queue expiry"}</span>
          <strong>{new Date(run.queue_expires_at).toLocaleString(locale)}</strong>
        </div>
      </section>

      {run.status === "RUNNER_OFFLINE" && (
        <div className="control-warning">
          <Clock3 size={19} />
          <p>
            {ko
              ? "VM Runner가 오프라인입니다. 요청은 최대 24시간 대기하며, 만료 후에는 다시 준비해야 합니다."
              : "The VM runner is offline. The request remains queued for up to 24 hours and must be prepared again after expiry."}
          </p>
        </div>
      )}

      {contract && (
        <section className="compiled-contract">
          <div className="section-heading">
            <div>
              <p className="section-label">{ko ? "실행 전 검토" : "Pre-execution review"}</p>
              <h2>{ko ? "컴파일된 연구 계약" : "Compiled research contract"}</h2>
            </div>
            <span>{contract.run_mode}</span>
          </div>

          {contract.material_inferences.length > 0 && (
            <div className="inference-list">
              <h3>{ko ? "시스템이 해석한 항목" : "Material inferences"}</h3>
              {contract.material_inferences.map((item) => (
                <div key={`${item.field}-${formatValue(item.to)}`}>
                  <strong>{item.field}</strong>
                  <span>{formatValue(item.from)} → {formatValue(item.to)}</span>
                  <p>{item.reason}</p>
                </div>
              ))}
            </div>
          )}

          <dl className="contract-grid">
            <div><dt>{ko ? "문헌 범위 포함" : "Literature scope"}</dt><dd>{formatValue(contract.include_literature_list_and_review_scope)}</dd></div>
            <div><dt>{ko ? "대상 Runner" : "Target runner"}</dt><dd>{contract.target_runner}</dd></div>
            <div><dt>{ko ? "출력 경로 정책" : "Output root policy"}</dt><dd>{contract.output_root_policy}</dd></div>
            <div><dt>{ko ? "소스 경계" : "Source boundary"}</dt><dd>{contract.source_boundary}</dd></div>
            <div><dt>{ko ? "비교 기준 격리" : "Baseline isolation"}</dt><dd>{contract.contamination_boundary}</dd></div>
          </dl>

          {budget && (
            <div className="budget-strip" aria-label={ko ? "실행 예산 상한" : "Run budget ceilings"}>
              <div><span>{ko ? "호출" : "Calls"}</span><strong>{budget.successful_calls}</strong></div>
              <div><span>{ko ? "입력 토큰" : "Input tokens"}</span><strong>{budget.input_tokens.toLocaleString()}</strong></div>
              <div><span>{ko ? "출력 토큰" : "Output tokens"}</span><strong>{budget.output_tokens.toLocaleString()}</strong></div>
              <div><span>{ko ? "비용 상한" : "Cost cap"}</span><strong>${budget.cost_usd.toFixed(2)}</strong></div>
              <div><span>{ko ? "시간 상한" : "Time cap"}</span><strong>{Math.round(budget.wall_clock_seconds / 3600)}h</strong></div>
            </div>
          )}

          <div className="stop-rules">
            <h3>{ko ? "강제 중단 규칙" : "Hard stop rules"}</h3>
            <ul>{contract.stop_rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          </div>
        </section>
      )}

      <section className="event-timeline">
        <div className="section-heading">
          <div>
            <p className="section-label">{ko ? "진행 기록" : "Progress record"}</p>
            <h2>{ko ? "안전한 상태 이벤트" : "Safe status events"}</h2>
          </div>
          <span>{events.length}</span>
        </div>
        {events.length === 0 ? (
          <p className="muted-text">{ko ? "아직 수신된 이벤트가 없습니다." : "No events received yet."}</p>
        ) : events.map((event, index) => (
          <div className="event-row" key={`${event.timestamp}-${event.stage}`}>
            <span className="event-marker">{index === events.length - 1 ? <CircleDot size={17} /> : <Check size={15} />}</span>
            <div>
              <strong>{event.stage.replaceAll("_", " ")}</strong>
              <p>{event.message}</p>
            </div>
            <span>{Math.round(event.progress * 100)}%</span>
          </div>
        ))}
      </section>

      {canApprove && (
        <section className="approval-panel">
          <AlertTriangle size={21} />
          <div>
            <h2>{ko ? "명시적 실행 승인" : "Explicit execution approval"}</h2>
            <p>
              {ko
                ? "위 연구 모드, 자동 해석 항목, 문헌 범위, 비용·토큰·시간 상한을 확인한 뒤 승인하세요."
                : "Confirm the research mode, inferred fields, literature scope, and cost, token, and time ceilings before approval."}
            </p>
            <label>
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>{ko ? "컴파일된 계약과 상한을 검토했습니다." : "I reviewed the compiled contract and ceilings."}</span>
            </label>
            <button className="primary-button" type="button" disabled={!confirmed || busy} onClick={() => act("approve")}>
              <Check size={17} /> {ko ? "승인하고 실행" : "Approve and run"}
            </button>
          </div>
        </section>
      )}

      <div className="run-control-actions">
        {run.status === "QUEUE_EXPIRED" && (
          <button
            className="primary-button"
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!session) return;
              setBusy(true);
              setError("");
              try {
                setRun(await redispatchControlledRun(runId, session.csrf_token));
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : "The request failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Clock3 size={17} /> {ko ? "Preflight 다시 보내기" : "Re-dispatch preflight"}
          </button>
        )}
        {canCancel && (
          <button className="secondary-button danger-action" type="button" disabled={busy} onClick={() => act("cancel")}>
            <Ban size={17} /> {ko ? "실행 취소" : "Cancel run"}
          </button>
        )}
        <button className="secondary-button" type="button" disabled={busy} onClick={() => refresh(runId)}>
          <LoaderCircle size={17} /> {ko ? "상태 새로고침" : "Refresh status"}
        </button>
      </div>
      {error && <p className="control-error" role="alert">{error}</p>}
    </div>
  );
}
