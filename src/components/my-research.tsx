"use client";

import {
  Archive,
  Clock3,
  Library,
  LoaderCircle,
  MoreHorizontal,
  PackageCheck,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { usePreferences } from "@/lib/preferences";
import { withBasePath } from "@/lib/paths";
import { compactResearchTitle } from "@/lib/research-title";
import {
  archiveControlledRun,
  deleteControlledRun,
  getMyRuns,
  restoreControlledRun,
  runControlApiBase,
  type CreatorRunListItem,
  type RunControlSession,
} from "@/lib/run-control-api";

type ResearchView = "active" | "completed" | "archived";

const deletableStatuses = new Set([
  "EXECUTION_DISABLED",
  "CANCELLED",
  "FAILED",
  "COMPLETED",
]);
const activeStatuses = new Set([
  "STARTING",
  "QUEUED",
  "RUNNING",
  "GENERATING_REPORTS",
]);
const finishedStatuses = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

function profileLabel(run: CreatorRunListItem, ko: boolean) {
  if (run.creativity_profile === "BREAKTHROUGH_DISCOVERY") {
    return ko ? "돌파구 탐색" : "Breakthrough Discovery";
  }
  return ko ? "표준 연구" : "Standard";
}

/* Stage names the Backend is allowed to publish. Anything unlisted is dropped
   rather than shown as a raw identifier. */
const STAGE_LABELS: Record<string, [string, string]> = {
  runner_accepted: ["실행 시작", "Execution started"],
  source_preflight: ["사전 점검", "Preflight"],
  scientific_framing: ["문제 재구성", "Reframing the problem"],
  mechanistic_decomposition: ["기전 분해", "Decomposing the mechanism"],
  blind_multi_lens_ideation: ["다중 렌즈 발상", "Multi-lens ideation"],
  idea_generation: ["아이디어 생성", "Generating ideas"],
  presearch_idea_freeze: ["아이디어 동결", "Idea freeze"],
  literature_retrieval: ["문헌 검색", "Retrieving literature"],
  novelty_and_precedent_audit: ["신규성 대조", "Novelty audit"],
  mechanism_family_grouping: ["기전 계열 분류", "Grouping mechanisms"],
  family_grouping: ["계열 분류", "Grouping"],
  proposal_development: ["제안 구체화", "Developing proposals"],
  scientific_development: ["연구 구체화", "Scientific development"],
  skeptical_review: ["회의적 검토", "Skeptical review"],
  revision: ["제안 개정", "Revising proposals"],
  dual_axis_portfolio: ["이중축 포트폴리오", "Dual-axis portfolio"],
  comparison: ["비교", "Comparison"],
  synthesis: ["종합", "Synthesis"],
  report_generation: ["보고서 작성", "Generating reports"],
  publication_packaging: ["결과 정리", "Packaging results"],
};

/* The Backend falls back to the lowercased status when a run has no events yet,
   so an unstarted run reports its status as its stage. Showing that alongside
   the status badge printed the same fact twice, once untranslated. */
function stageLabel(
  stage: string,
  status: CreatorRunListItem["status"],
  ko: boolean,
): string | null {
  if (!stage || stage.toLowerCase() === status.toLowerCase()) return null;
  const label = STAGE_LABELS[stage];
  return label ? (ko ? label[0] : label[1]) : null;
}

function statusLabel(status: CreatorRunListItem["status"], ko: boolean) {
  const labels: Record<string, [string, string]> = {
    STARTING: ["시작 중", "Starting"],
    EXECUTION_DISABLED: ["실행 비활성화", "Execution disabled"],
    QUEUED: ["대기 중", "Queued"],
    RUNNING: ["실행 중", "Running"],
    GENERATING_REPORTS: ["결과 작성 중", "Generating results"],
    COMPLETED: ["완료", "Completed"],
    FAILED: ["실패", "Failed"],
    CANCELLED: ["취소됨", "Cancelled"],
  };
  const value = labels[status] ?? [status, status];
  return ko ? value[0] : value[1];
}

function deletionKey(runId: string) {
  return "portal-delete:" + runId;
}

export function MyResearch({ session }: { session: RunControlSession | null }) {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const { preferences, loaded: preferencesLoaded } = usePreferences();
  const [view, setView] = useState<ResearchView>("active");
  const viewSeeded = useRef(false);
  const viewChosen = useRef(false);

  /* Open on the saved tab. Preferences resolve after the first paint, so a
     reader can switch tabs before they land; seeding must never take that back. */
  useEffect(() => {
    if (viewSeeded.current || !preferencesLoaded) return;
    viewSeeded.current = true;
    if (viewChosen.current) return;
    setView(preferences.defaultResearchView);
  }, [preferencesLoaded, preferences.defaultResearchView]);
  const [result, setResult] = useState<{
    email: string;
    active: CreatorRunListItem[];
    archived: CreatorRunListItem[];
    error: string;
  } | null>(null);
  const [busyRunId, setBusyRunId] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletion, setDeletion] = useState<{
    run: CreatorRunListItem;
    confirmation: string;
  } | null>(null);
  const loaded = Boolean(session && result?.email === session.email);
  const loading = Boolean(session && !loaded);

  const loadRuns = useCallback(async (activeSession: RunControlSession) => {
    const [current, archived] = await Promise.all([
      getMyRuns(50, 0, false),
      getMyRuns(50, 0, true),
    ]);
    setResult({
      email: activeSession.email,
      active: current.runs,
      archived: archived.runs,
      error: "",
    });
  }, []);

  useEffect(() => {
    let active = true;
    if (!session) return () => { active = false; };
    void Promise.resolve()
      .then(() => loadRuns(session))
      .catch((reason) => {
      if (!active) return;
      setResult({
        email: session.email,
        active: [],
        archived: [],
        error: reason instanceof Error ? reason.message : "Unable to load private research.",
      });
    });
    return () => { active = false; };
  }, [loadRuns, session]);

  const runs = useMemo(() => {
    if (!loaded || !result) return [];
    if (view === "archived") return result.archived;
    if (view === "completed") {
      return result.active.filter((run) => finishedStatuses.has(run.status));
    }
    return result.active.filter((run) => activeStatuses.has(run.status));
  }, [loaded, result, view]);
  const error = loaded ? result?.error ?? "" : "";

  const refreshAfterMutation = useCallback(async () => {
    if (session) await loadRuns(session);
  }, [loadRuns, session]);

  const archiveRun = async (run: CreatorRunListItem) => {
    if (!session) return;
    setBusyRunId(run.run_id);
    setActionError("");
    setResult((current) => current
      ? { ...current, active: current.active.filter((item) => item.run_id !== run.run_id) }
      : current);
    try {
      await archiveControlledRun(run.run_id, session.csrf_token);
      await refreshAfterMutation();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Unable to archive this Run.");
      await refreshAfterMutation().catch(() => undefined);
    } finally {
      setBusyRunId("");
    }
  };

  const restoreRun = async (run: CreatorRunListItem) => {
    if (!session) return;
    setBusyRunId(run.run_id);
    setActionError("");
    setResult((current) => current
      ? { ...current, archived: current.archived.filter((item) => item.run_id !== run.run_id) }
      : current);
    try {
      await restoreControlledRun(run.run_id, session.csrf_token);
      await refreshAfterMutation();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Unable to restore this Run.");
      await refreshAfterMutation().catch(() => undefined);
    } finally {
      setBusyRunId("");
    }
  };

  const permanentlyDelete = async () => {
    if (!session || !deletion) return;
    const accepted = deletion.confirmation === "DELETE"
      || deletion.confirmation === deletion.run.run_id;
    if (!accepted) return;
    setBusyRunId(deletion.run.run_id);
    setActionError("");
    try {
      const response = await deleteControlledRun(
        deletion.run.run_id,
        session.csrf_token,
        deletionKey(deletion.run.run_id),
        deletion.run.archive_category === "system_validation"
          ? "system_validation_cleanup"
          : "creator_requested_cleanup",
      );
      if (response.status === "PENDING_OBJECT_DELETE") {
        setActionError(
          ko
            ? "비공개 파일 삭제 확인이 진행 중입니다. 완료로 표시하지 않았습니다."
            : "Private file deletion is still being verified. The Run was not marked deleted.",
        );
        return;
      }
      setResult((current) => current
        ? {
            ...current,
            active: current.active.filter((item) => item.run_id !== deletion.run.run_id),
            archived: current.archived.filter((item) => item.run_id !== deletion.run.run_id),
          }
        : current);
      setDeletion(null);
      await refreshAfterMutation();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Unable to delete this Run.");
    } finally {
      setBusyRunId("");
    }
  };

  if (!runControlApiBase) return null;

  return (
    <section className="my-research-section" aria-labelledby="my-research-heading">
      <div className="my-research-heading-row">
        <h2 id="my-research-heading">{ko ? "내 연구" : "My Research"}</h2>
        {session && (
          <div className="my-research-tabs" role="tablist" aria-label="Research views">
            {(["active", "completed", "archived"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={view === item}
                onClick={() => { viewChosen.current = true; setView(item); }}
              >
                {item === "active"
                  ? (ko ? "진행 중" : "Active")
                  : item === "completed"
                    ? (ko ? "완료" : "Completed")
                    : (ko ? "보관됨" : "Archived")}
              </button>
            ))}
          </div>
        )}
      </div>
      {!session && (
        <p className="my-research-empty">
          {ko ? "아직 실행한 연구가 없습니다." : "No research yet."}
        </p>
      )}
      {loading && (
        <p className="control-loading" role="status">
          <LoaderCircle className="spin" size={18} />
          {ko ? "비공개 연구를 불러오는 중입니다." : "Loading private research."}
        </p>
      )}
      {session && (error || actionError) && (
        <p className="control-error" role="alert">{actionError || error}</p>
      )}
      {session && loaded && runs.length === 0 && (
        <p className="my-research-empty">
          {view === "archived"
            ? (ko ? "보관된 연구가 없습니다." : "No archived research.")
            : view === "completed"
              ? (ko ? "완료된 연구가 없습니다." : "No completed research.")
              : (ko ? "아직 실행한 연구가 없습니다." : "No research yet.")}
        </p>
      )}
      {session && runs.length > 0 && (
        <div className="my-research-list">
          {runs.map((run) => (
            <article key={run.run_id} className={`run-${run.status.toLowerCase()}`}>
              <div>
                <p className="my-research-meta">
                  <span>{statusLabel(run.status, ko)}</span>
                  <span>{profileLabel(run, ko)}</span>
                  {stageLabel(run.current_stage, run.status, ko) && (
                    <span>{stageLabel(run.current_stage, run.status, ko)}</span>
                  )}
                  {run.archive_category === "system_validation" && (
                    <span>{ko ? "시스템 검증" : "System validation"}</span>
                  )}
                </p>
                <h3>
                  <Link
                    className="my-research-title"
                    href={withBasePath(`/run-control/?run_id=${encodeURIComponent(run.run_id)}&lang=${locale}`)}
                  >
                    {run.display_title?.trim()
                      || compactResearchTitle(run.research_question)
                      || run.run_id}
                  </Link>
                </h3>
                <p>
                  {new Date(run.updated_at).toLocaleString(locale)}
                  {` · ${Math.round(run.progress_percentage)}%`}
                </p>
              </div>
              <div className="my-research-card-side">
                <details className="run-action-menu">
                  <summary aria-label={`${run.display_title || run.run_id} actions`}>
                    <MoreHorizontal size={19} aria-hidden="true" />
                  </summary>
                  <div>
                    {view !== "archived" && (
                      <button
                        type="button"
                        disabled={busyRunId === run.run_id}
                        onClick={() => void archiveRun(run)}
                      >
                        <Archive size={15} aria-hidden="true" />
                        {ko ? "보관" : "Archive"}
                      </button>
                    )}
                    {view === "archived" && run.archive_category === "creator_archived" && (
                      <button
                        type="button"
                        disabled={busyRunId === run.run_id}
                        onClick={() => void restoreRun(run)}
                      >
                        <RotateCcw size={15} aria-hidden="true" />
                        {ko ? "복원" : "Restore"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="danger"
                      disabled={
                        busyRunId === run.run_id
                        || !deletableStatuses.has(run.status)
                      }
                      title={!deletableStatuses.has(run.status)
                        ? (ko ? "종료된 연구만 삭제할 수 있습니다." : "Only terminal Runs can be deleted.")
                        : undefined}
                      onClick={() => setDeletion({
                        run,
                        confirmation: "",
                      })}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      {ko ? "영구 삭제" : "Delete permanently"}
                    </button>
                  </div>
                </details>
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
              </div>
            </article>
          ))}
        </div>
      )}
      {deletion && (
        <div className="run-delete-backdrop" role="presentation">
          <section
            className="run-delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-delete-title"
          >
            <button
              type="button"
              className="run-delete-close"
              aria-label={ko ? "닫기" : "Close"}
              onClick={() => setDeletion(null)}
            >
              <X size={18} />
            </button>
            <h3 id="run-delete-title">{ko ? "연구를 영구 삭제할까요?" : "Permanently delete this Run?"}</h3>
            <p>
              {ko
                ? "보고서와 모든 비공개 파일이 함께 삭제되며 복구할 수 없습니다."
                : "Reports and all private files will be removed and cannot be recovered."}
            </p>
            <p className="run-delete-id"><code>{deletion.run.run_id}</code></p>
            <label htmlFor="run-delete-confirmation">
              {ko
                ? "DELETE 또는 정확한 Run ID를 입력하세요."
                : "Type DELETE or the exact Run ID to continue."}
            </label>
            <input
              id="run-delete-confirmation"
              autoComplete="off"
              value={deletion.confirmation}
              onChange={(event) => setDeletion({
                ...deletion,
                confirmation: event.target.value,
              })}
            />
            <div className="run-delete-actions">
              <button type="button" onClick={() => setDeletion(null)}>
                {ko ? "취소" : "Cancel"}
              </button>
              <button
                type="button"
                className="danger"
                disabled={
                  busyRunId === deletion.run.run_id
                  || !(
                    deletion.confirmation === "DELETE"
                    || deletion.confirmation === deletion.run.run_id
                  )
                }
                onClick={() => void permanentlyDelete()}
              >
                {busyRunId === deletion.run.run_id
                  ? (ko ? "삭제 확인 중…" : "Verifying deletion…")
                  : (ko ? "영구 삭제" : "Delete permanently")}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
