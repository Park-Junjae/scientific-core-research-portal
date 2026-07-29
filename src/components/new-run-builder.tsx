"use client";

import {
  ArrowRight,
  Check,
  Download,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { AccessConnectionPanel } from "@/components/access-connection-panel";
import { useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import {
  buildRunRequest,
  initialRunRequest,
  normalizeImportedRequest,
  type RunRequestDraft,
} from "@/lib/run-request";
import {
  buildControlledRunPayload,
  createControlledRun,
  runControlApiBase,
  type PortalSelectableRunMode,
  type RunControlSession,
} from "@/lib/run-control-api";

function downloadRequest(body: unknown) {
  const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "run-request.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function lines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

interface ResearchComposerProps {
  session?: RunControlSession | null;
  onConnected?: (session: RunControlSession | null) => void;
}

export function ResearchComposer({
  session,
  onConnected,
}: ResearchComposerProps = {}) {
  const { locale } = useLocale();
  const router = useRouter();
  const ko = locale === "ko";
  const [value, setValue] = useState<RunRequestDraft>(initialRunRequest);
  const [localSession, setLocalSession] = useState<RunControlSession | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submissionGuard = useRef(false);
  const requestLocator = useRef("");
  const activeSession = session === undefined ? localSession : session;
  const request = useMemo(() => buildRunRequest(value, locale), [locale, value]);
  const ready = Boolean(value.raw_research_request.trim());
  const breakthrough = value.creativity_profile === "BREAKTHROUGH_DISCOVERY";

  const update = <K extends keyof RunRequestDraft>(key: K, next: RunRequestDraft[K]) => {
    if (!busy) requestLocator.current = "";
    setSaved(false);
    setMessage("");
    setValue((current) => ({ ...current, [key]: next }));
  };

  const connected = useCallback((nextSession: RunControlSession | null) => {
    setLocalSession(nextSession);
    onConnected?.(nextSession);
  }, [onConnected]);

  async function prepareRun() {
    if (!ready || busy || submissionGuard.current || !runControlApiBase) return;
    submissionGuard.current = true;
    setBusy(true);
    setMessage(ko ? "연구를 시작하고 있습니다…" : "Starting research…");
    if (!activeSession) {
      setMessage(ko
        ? "Google로 계속하여 계정을 연결하세요."
        : "Continue with Google to connect your account.");
      submissionGuard.current = false;
      setBusy(false);
      return;
    }
    requestLocator.current ||= `portal-${crypto.randomUUID()}`;
    const researchQuestion = value.research_question.trim()
      || value.raw_research_request.trim();
    const objectives = lines(value.research_goal || value.success_criteria);
    const constraints = lines([
      value.reference_material_or_constraints,
      value.experimental_constraints,
      value.failure_criteria,
      value.non_goals,
    ].filter(Boolean).join("\n"));
    const reportLanguage = value.output_language || locale;
    try {
      const run = await createControlledRun(
        buildControlledRunPayload({
          researchQuestion,
          objectives,
          constraints,
          requestedMode: (
            breakthrough
              ? "DISCOVERY_PORTFOLIO_RUN"
              : "FOCUSED_DECISION_RUN"
          ) as PortalSelectableRunMode,
          creativityProfile: value.creativity_profile,
          includeLiteratureScope: value.literature_scope_enabled,
          reportLanguage,
        }),
        activeSession.csrf_token,
        requestLocator.current,
      );
      window.sessionStorage.setItem(
        `scientific-core-run-draft:${run.run_id}`,
        JSON.stringify({
          research_question: researchQuestion,
          objectives,
          constraints,
          selected_mode: breakthrough
            ? "DISCOVERY_PORTFOLIO_RUN"
            : "FOCUSED_DECISION_RUN",
          creativity_profile: value.creativity_profile,
          literature_scope: value.literature_scope_enabled,
          report_language: reportLanguage,
        }),
      );
      setMessage(ko
        ? "연구를 시작하고 있습니다."
        : "Starting research.");
      router.push(withBasePath(`/run-control/?run_id=${encodeURIComponent(run.run_id)}&lang=${locale}&created=1`));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Unable to prepare the run.");
      submissionGuard.current = false;
      setBusy(false);
    }
  }

  const textArea = (
    key: keyof Pick<RunRequestDraft,
      "research_goal" | "experimental_constraints" | "research_question"
      | "current_bottleneck" | "success_criteria" | "failure_criteria"
      | "non_goals" | "custom_requested_outputs" | "notes">,
    label: string,
    rows = 3,
  ) => (
    <label>
      <span>{label}</span>
      <textarea rows={rows} value={value[key]} onChange={(event) => update(key, event.target.value)} />
    </label>
  );

  return (
    <section className="research-composer-shell" aria-label="Research setup">
      <form className="intake-form homepage-composer" onSubmit={(event) => { event.preventDefault(); void prepareRun(); }}>
        <div className="composer-core-grid">
          <label className="primary-request-field">
            <span>Research goal<b aria-hidden="true"> *</b></span>
            <textarea
              aria-label="Research goal"
              required
              rows={8}
              value={value.raw_research_request}
              onChange={(event) => update("raw_research_request", event.target.value)}
              placeholder={ko
                ? "어떤 연구를 진행하고 싶나요?\n현재 문제, 목표, 제약 조건을 자유롭게 작성하세요."
                : "What research would you like to pursue?\nDescribe the current problem, goal, and constraints."}
            />
            <small className="research-privacy-line">
              {ko
                ? "모든 연구 질문과 결과는 계정별 비공개로 처리됩니다."
                : "All research questions and results are private to your account."}
            </small>
          </label>

          <fieldset className="creativity-selector prominent">
            <legend>Research mode</legend>
            <div className="creativity-options">
              <label className={breakthrough ? "" : "selected"}>
                <input type="radio" name="creativity-profile" value="STANDARD" checked={!breakthrough} onChange={() => update("creativity_profile", "STANDARD")} />
                <span>
                  <strong>STANDARD</strong>
                  <ul>
                    <li>Evidence-first research</li>
                    <li>Focused analysis</li>
                    <li>Testable conclusions</li>
                  </ul>
                </span>
              </label>
              <label className={breakthrough ? "selected breakthrough" : "breakthrough"}>
                <input type="radio" name="creativity-profile" value="BREAKTHROUGH_DISCOVERY" checked={breakthrough} onChange={() => update("creativity_profile", "BREAKTHROUGH_DISCOVERY")} />
                <span>
                  <strong>BREAKTHROUGH DISCOVERY</strong>
                  <ul>
                    <li>Broad ideation before literature search</li>
                    <li>Cross-domain mechanism search</li>
                    <li>Novelty and feasibility assessed separately</li>
                  </ul>
                </span>
              </label>
            </div>
          </fieldset>
        </div>

        {runControlApiBase && <AccessConnectionPanel onSessionChange={connected} compact />}

        <details className="advanced-fields">
          <summary>Options</summary>
          <div>
            <div className="request-direct-fields">
              {textArea("research_goal", "Objectives")}
              {textArea("experimental_constraints", "Constraints")}
              <label>
                <span>Report language</span>
                <select value={value.output_language} onChange={(event) => update("output_language", event.target.value as RunRequestDraft["output_language"])}>
                  <option value="">Current portal language</option>
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="bilingual">Korean + English</option>
                </select>
              </label>
            </div>
            <label className="literature-scope-toggle">
              <input type="checkbox" checked={value.literature_scope_enabled} onChange={(event) => update("literature_scope_enabled", event.target.checked)} />
              <span>Include literature review and complete source ledger</span>
            </label>
            <label>
              <span>References and additional constraints</span>
              <textarea rows={4} value={value.reference_material_or_constraints} onChange={(event) => update("reference_material_or_constraints", event.target.value)} />
            </label>
            {textArea("research_question", "Structured research question", 4)}
            {textArea("current_bottleneck", "Current bottleneck")}
            {textArea("success_criteria", "Success criteria")}
            {textArea("failure_criteria", "Failure criteria")}
            {textArea("non_goals", "Non-goals")}
            {textArea("custom_requested_outputs", "Additional outputs")}
            {textArea("notes", "Notes")}
            <label className="request-import">
              <span><Upload size={16} />Import JSON</span>
              <input type="file" accept=".json,application/json" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  setValue(normalizeImportedRequest(JSON.parse(await file.text()), locale));
                  setMessage(ko ? "기존 요청을 불러왔습니다." : "Existing request loaded.");
                } catch {
                  setMessage(ko ? "요청 파일을 읽을 수 없습니다." : "The request file could not be read.");
                }
              }} />
            </label>
            <button className="secondary-button" type="button" disabled={!ready} onClick={() => { downloadRequest(request); setSaved(true); }}>
              {saved ? <Check size={18} /> : <Download size={18} />}
              {saved ? "JSON exported" : "Export JSON"}
            </button>
          </div>
        </details>

        <div className="run-request-actions">
          <button
            aria-busy={busy}
            className="primary-button review-plan-button"
            type="submit"
            disabled={!ready || busy || !runControlApiBase || !activeSession}
          >
            {busy ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
            {busy
              ? (ko ? "연구를 시작하고 있습니다…" : "Starting research…")
              : (ko ? "연구 시작" : "Start research")}
          </button>
          {!activeSession && (
            <small className="run-request-hint">
              {ko ? "Google로 계속하여 연구를 시작하세요." : "Continue with Google to start research."}
            </small>
          )}
        </div>
        {!runControlApiBase && <div className="intake-message" role="status"><p>{ko ? "연구 실행 기능은 준비 중입니다." : "Research execution is being prepared."}</p></div>}
        {message && (
          <div
            aria-live="polite"
            className="intake-message"
            role={busy ? "status" : "alert"}
          >
            <p>{message}</p>
          </div>
        )}
      </form>
    </section>
  );
}

export function NewRunBuilder() {
  return <ResearchComposer />;
}
