"use client";

import {
  ArrowRight,
  Check,
  Download,
  FlaskConical,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
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
  BREAKTHROUGH_RUNTIME_REF,
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

const modes: Array<[RunRequestDraft["run_type"], { ko: string; en: string }]> = [
  ["", { ko: "자동 선택", en: "Choose automatically" }],
  ["FOCUSED_DECISION_RUN", { ko: "집중 의사결정", en: "Focused decision" }],
  ["DISCOVERY_PORTFOLIO_RUN", { ko: "탐색 포트폴리오", en: "Discovery portfolio" }],
];

interface ResearchComposerProps {
  session?: RunControlSession | null;
  onConnected?: (session: RunControlSession) => void;
}

export function ResearchComposer({
  session,
  onConnected,
}: ResearchComposerProps = {}) {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const [value, setValue] = useState<RunRequestDraft>(initialRunRequest);
  const [localSession, setLocalSession] = useState<RunControlSession | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const activeSession = session === undefined ? localSession : session;
  const request = useMemo(() => buildRunRequest(value, locale), [locale, value]);
  const ready = Boolean(value.raw_research_request.trim());
  const breakthrough = value.creativity_profile === "BREAKTHROUGH_DISCOVERY";

  const update = <K extends keyof RunRequestDraft>(key: K, next: RunRequestDraft[K]) => {
    setSaved(false);
    setMessage("");
    setValue((current) => ({ ...current, [key]: next }));
  };

  function connected(nextSession: RunControlSession) {
    setLocalSession(nextSession);
    onConnected?.(nextSession);
  }

  async function prepareRun() {
    if (!ready || busy || !runControlApiBase) return;
    if (!activeSession) {
      setMessage(ko
        ? "먼저 랩 계정을 연결하고 연결 상태를 확인하세요."
        : "Connect the lab account and check the connection first.");
      return;
    }
    setBusy(true);
    setMessage("");
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
          requestedMode: (value.run_type || "AUTO") as PortalSelectableRunMode,
          creativityProfile: value.creativity_profile,
          includeLiteratureScope: value.literature_scope_enabled,
          reportLanguage,
        }),
        activeSession.csrf_token,
      );
      window.sessionStorage.setItem(
        `scientific-core-run-draft:${run.run_id}`,
        JSON.stringify({
          research_question: researchQuestion,
          objectives,
          constraints,
          selected_mode: breakthrough ? "DISCOVERY_PORTFOLIO_RUN" : (value.run_type || "AUTO"),
          creativity_profile: value.creativity_profile,
          literature_scope: value.literature_scope_enabled,
          report_language: reportLanguage,
          runtime_ref: breakthrough ? BREAKTHROUGH_RUNTIME_REF : "Assigned by Backend preflight",
        }),
      );
      setMessage(ko
        ? "비공개 사전 검토를 만들었습니다. 컴파일된 연구 계획을 여는 중입니다."
        : "Private preflight created. Opening the compiled research plan.");
      window.location.assign(withBasePath(`/run-control/?run_id=${encodeURIComponent(run.run_id)}&lang=${locale}`));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Unable to prepare the run.");
    } finally {
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
    <section className="research-composer-shell" aria-labelledby="research-composer-heading">
      <div className="composer-heading">
        <div>
          <p className="section-label">{ko ? "실제 비공개 연구 시작" : "Start a real private run"}</p>
          <h2 id="research-composer-heading">{ko ? "무엇을 연구할까요?" : "What should we investigate?"}</h2>
        </div>
        <span><ShieldCheck size={15} />{ko ? "승인 전 provider 호출 0" : "0 provider calls before approval"}</span>
      </div>

      <form className="intake-form homepage-composer" onSubmit={(event) => { event.preventDefault(); void prepareRun(); }}>
        <div className="workflow-steps" aria-label={ko ? "연구 실행 단계" : "Research workflow"}>
          <strong>1. {ko ? "질문과 모드" : "Question and mode"}</strong>
          <span>2. {ko ? "무비용 사전 검토" : "Zero-provider preflight"}</span>
          <span>3. {ko ? "직접 승인·실행·결과" : "Self-approval, execution, results"}</span>
        </div>

        <div className="composer-core-grid">
          <label className="primary-request-field">
            <span>{ko ? "연구 질문" : "Research question"}<b aria-hidden="true"> *</b></span>
            <textarea
              required
              rows={8}
              value={value.raw_research_request}
              onChange={(event) => update("raw_research_request", event.target.value)}
              placeholder={ko
                ? "현재 문제, 원하는 결정, 성공 조건을 자연어로 적어주세요."
                : "Describe the problem, decision, and success conditions in natural language."}
            />
            <small>{ko ? "질문은 비공개로 Backend에 저장되며 정적 공개 사이트에 포함되지 않습니다." : "The question is stored privately by the Backend and never added to the static public site."}</small>
          </label>

          <fieldset className="creativity-selector prominent">
            <legend>{ko ? "연구 방식 선택" : "Choose the research mode"}</legend>
            <div className="creativity-options">
              <label className={breakthrough ? "" : "selected"}>
                <input type="radio" name="creativity-profile" value="STANDARD" checked={!breakthrough} onChange={() => update("creativity_profile", "STANDARD")} />
                <span>
                  <strong>STANDARD</strong>
                  <small>{ko ? "근거 중심 · 집중적 · 검증 가능" : "Evidence-led · focused · verifiable"}</small>
                  <ul>
                    <li>{ko ? "정상 생성 폭" : "Normal generation breadth"}</li>
                    <li>{ko ? "명확한 결정과 검증 경계" : "Focused decision and verification boundary"}</li>
                  </ul>
                </span>
              </label>
              <label className={breakthrough ? "selected breakthrough" : "breakthrough"}>
                <input type="radio" name="creativity-profile" value="BREAKTHROUGH_DISCOVERY" checked={breakthrough} onChange={() => update("creativity_profile", "BREAKTHROUGH_DISCOVERY")} />
                <span>
                  <strong><Sparkles size={15} />BREAKTHROUGH DISCOVERY</strong>
                  <small>{ko ? "아이디어를 먼저 동결하고 선례를 나중에 감사합니다." : "Freeze ideas first; audit precedent afterward."}</small>
                  <ul>
                    <li>{ko ? "맹검 다중 렌즈 발상" : "Blind multi-lens ideation"}</li>
                    <li>{ko ? "교차 분야 전이와 기전 계열화" : "Cross-domain transfer and mechanism families"}</li>
                    <li>{ko ? "신규성 감사와 이중축 포트폴리오" : "Novelty audit and dual-axis portfolio"}</li>
                  </ul>
                </span>
              </label>
            </div>
          </fieldset>
        </div>

        <div className="request-direct-fields">
          {textArea("research_goal", ko ? "목표 (선택)" : "Objectives (optional)")}
          {textArea("experimental_constraints", ko ? "실험 제약 (선택)" : "Experimental constraints (optional)")}
          <label>
            <span>{ko ? "보고서 언어" : "Report language"}</span>
            <select value={value.output_language} onChange={(event) => update("output_language", event.target.value as RunRequestDraft["output_language"])}>
              <option value="">{ko ? "현재 화면 언어" : "Current portal language"}</option>
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="bilingual">{ko ? "한국어 + English" : "Korean + English"}</option>
            </select>
          </label>
        </div>

        <label className="literature-scope-toggle">
          <input type="checkbox" checked={value.literature_scope_enabled} onChange={(event) => update("literature_scope_enabled", event.target.checked)} />
          <span>{ko ? "문헌 검토와 전체 출처 원장 포함" : "Include literature review and complete source ledger"}</span>
        </label>

        <section className={`selected-profile-summary${breakthrough ? " breakthrough" : ""}`} data-profile={value.creativity_profile}>
          <div>
            {breakthrough ? <Sparkles size={19} /> : <FlaskConical size={19} />}
            <div>
              <p>{ko ? "선택 확인" : "Selected-state summary"}</p>
              <h3>{breakthrough ? "Breakthrough Discovery" : "Standard"}</h3>
            </div>
          </div>
          <dl>
            <div><dt>{ko ? "실행 모드" : "Run mode"}</dt><dd>{breakthrough ? "DISCOVERY PORTFOLIO" : (value.run_type || "AUTO")}</dd></div>
            <div><dt>{ko ? "예산 프로필" : "Budget profile"}</dt><dd>{breakthrough ? "breakthrough_discovery" : "standard"}</dd></div>
            <div><dt>Runtime</dt><dd>{breakthrough ? BREAKTHROUGH_RUNTIME_REF : (ko ? "사전 검토에서 고정" : "Bound during preflight")}</dd></div>
          </dl>
          <p>
            {breakthrough
              ? (ko
                  ? "사전 검색 아이디어 동결 → 교차 분야 전이 → 기전 계열화 → 신규성·선례 감사 → 발명/검증 이중축 포트폴리오"
                  : "Pre-search idea freeze → cross-domain transfer → mechanism families → novelty and precedent audit → invention/validation portfolio")
              : (ko
                  ? "근거 중심의 집중적이고 검증 가능한 연구 계획을 생성합니다."
                  : "Builds an evidence-led, focused, and verifiable research plan.")}
          </p>
        </section>

        {runControlApiBase && <AccessConnectionPanel onConnected={connected} compact />}

        <details className="advanced-fields">
          <summary>{ko ? "고급 설정과 요청 파일" : "Advanced settings and request file"}</summary>
          <div>
            <label>
              <span>{ko ? "세부 실행 모드" : "Detailed run mode"}</span>
              <select value={value.run_type} disabled={breakthrough} onChange={(event) => update("run_type", event.target.value as RunRequestDraft["run_type"])}>
                {modes.map(([id, labels]) => <option key={id} value={id}>{labels[locale]}</option>)}
              </select>
            </label>
            <label>
              <span>{ko ? "참고 문헌과 추가 제약" : "Reference material and additional constraints"}</span>
              <textarea rows={4} value={value.reference_material_or_constraints} onChange={(event) => update("reference_material_or_constraints", event.target.value)} />
            </label>
            {textArea("research_question", ko ? "구조화된 연구 질문" : "Structured research question", 4)}
            {textArea("current_bottleneck", ko ? "현재 병목" : "Current bottleneck")}
            {textArea("success_criteria", ko ? "성공 기준" : "Success criteria")}
            {textArea("failure_criteria", ko ? "실패 기준" : "Failure criteria")}
            {textArea("non_goals", ko ? "비목표" : "Non-goals")}
            {textArea("custom_requested_outputs", ko ? "추가 산출물" : "Additional outputs")}
            {textArea("notes", ko ? "메모" : "Notes")}
            <label className="request-import">
              <span><Upload size={16} />{ko ? "기존 요청 불러오기" : "Load an existing request"}</span>
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
              {saved ? (ko ? "요청 저장됨" : "Request saved") : (ko ? "요청 파일 저장" : "Save request file")}
            </button>
          </div>
        </details>

        <div className="run-request-actions">
          <button className="primary-button review-plan-button" type="submit" disabled={!ready || busy || !runControlApiBase || !activeSession}>
            {busy ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
            {ko ? "연구 계획 확인" : "Review research plan"}
          </button>
          {!activeSession && (
            <small className="run-request-hint">
              {ko ? "계정을 연결하고 확인하면 사전 검토를 시작할 수 있습니다." : "Connect and check the account to enable preflight."}
            </small>
          )}
        </div>
        <p className="research-entry-note">
          {ko ? "사전 검토는 외부 모델을 호출하지 않으며 provider 비용은 USD 0입니다." : "Preflight calls no external model and keeps provider cost at USD 0."}
        </p>
        {!runControlApiBase && <div className="intake-message" role="status"><p>{ko ? "연구 실행 기능은 준비 중입니다." : "Research execution is being prepared."}</p></div>}
        {message && <div className="intake-message" role="alert"><p>{message}</p></div>}
      </form>
    </section>
  );
}

export function NewRunBuilder() {
  return <ResearchComposer />;
}
