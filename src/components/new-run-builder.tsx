"use client";

import { Check, Download, FlaskConical, LoaderCircle, LogIn, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import {
  buildRunRequest,
  deriveRequestTitle,
  initialRunRequest,
  normalizeImportedRequest,
  type RunRequestDraft,
} from "@/lib/run-request";
import {
  buildControlledRunPayload,
  createControlledRun,
  getRunControlSession,
  runControlApiBase,
  RunControlApiError,
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
  ["VERIFICATION_RUN", { ko: "검증", en: "Verification" }],
  ["MEASUREMENT_DISCOVERY_RUN", { ko: "측정법 탐색", en: "Measurement discovery" }],
];

export function NewRunBuilder() {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const [value, setValue] = useState<RunRequestDraft>(initialRunRequest);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const request = useMemo(() => buildRunRequest(value, locale), [locale, value]);
  const ready = Boolean(value.raw_research_request.trim());
  const showPreview = ready
    || Boolean(value.research_goal.trim())
    || Boolean(value.experimental_constraints.trim());

  const update = <K extends keyof RunRequestDraft>(key: K, next: RunRequestDraft[K]) => {
    setSaved(false);
    setMessage("");
    setAuthRequired(false);
    setValue((current) => ({ ...current, [key]: next }));
  };

  async function prepareRun() {
    if (!ready || busy || !runControlApiBase) return;
    setBusy(true);
    setMessage("");
    setAuthRequired(false);
    try {
      const session = await getRunControlSession();
      const run = await createControlledRun(
        buildControlledRunPayload({
          researchQuestion: value.research_question.trim() || value.raw_research_request.trim(),
          objectives: lines(value.research_goal || value.success_criteria),
          constraints: lines([
            value.reference_material_or_constraints,
            value.experimental_constraints,
            value.failure_criteria,
            value.non_goals,
          ].filter(Boolean).join("\n")),
          requestedMode: value.run_type || "AUTO",
          creativityProfile: value.creativity_profile,
          includeLiteratureScope: value.literature_scope_enabled,
          reportLanguage: value.output_language || locale,
        }),
        session.csrf_token,
      );
      window.location.assign(withBasePath(`/run-control/?run_id=${encodeURIComponent(run.run_id)}`));
    } catch (reason) {
      if (reason instanceof RunControlApiError && reason.status === 401) {
        setAuthRequired(true);
        setMessage(ko
          ? "허용된 Cloudflare Access 계정으로 인증해야 합니다."
          : "Authenticate with an allowlisted Cloudflare Access account.");
      } else {
        setMessage(reason instanceof Error ? reason.message : "Unable to prepare the run.");
      }
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
    <div className={`intake-layout${showPreview ? " has-preview" : ""}`}>
      <form className="intake-form" onSubmit={(event) => { event.preventDefault(); prepareRun(); }}>
        <div className="workflow-steps" aria-label={ko ? "연구 실행 단계" : "Research workflow"}>
          <strong>1. {ko ? "요청" : "Request"}</strong>
          <span>2. {ko ? "사전 검토" : "Preflight review"}</span>
          <span>3. {ko ? "승인·실행·결과" : "Approval, execution, results"}</span>
        </div>

        <label className="primary-request-field">
          <span>{ko ? "연구 질문" : "Research question"}<b aria-hidden="true"> *</b></span>
          <textarea
            required
            rows={7}
            value={value.raw_research_request}
            onChange={(event) => update("raw_research_request", event.target.value)}
            placeholder={ko ? "무엇을 이해하거나 해결하려는지 적어주세요." : "Describe what you want to understand or solve."}
          />
          <small>{ko ? "현재 문제, 원하는 결과, 반드시 지켜야 할 조건을 함께 적어도 됩니다." : "You may include the current problem, desired outcome, and constraints."}</small>
        </label>

        <div className="request-direct-fields">
          {textArea("research_goal", ko ? "연구 목표" : "Objectives")}
          {textArea("experimental_constraints", ko ? "제약 조건" : "Constraints")}
          <label>
            <span>{ko ? "요청 모드" : "Requested mode"}</span>
            <select value={value.run_type} onChange={(event) => update("run_type", event.target.value as RunRequestDraft["run_type"])}>
              {modes.map(([id, labels]) => <option key={id} value={id}>{labels[locale]}</option>)}
            </select>
          </label>
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

        <fieldset className="creativity-selector">
          <legend>{ko ? "창의성 프로필" : "Creativity profile"}</legend>
          <div className="creativity-options">
            <label className={value.creativity_profile === "STANDARD" ? "selected" : ""}>
              <input type="radio" name="creativity-profile" value="STANDARD" checked={value.creativity_profile === "STANDARD"} onChange={() => update("creativity_profile", "STANDARD")} />
              <span><strong>{ko ? "Standard" : "Standard"}</strong><small>{ko ? "근거 중심의 검증 가능한 연구 방향" : "Evidence-led, testable research directions."}</small></span>
            </label>
            <label className={value.creativity_profile === "BREAKTHROUGH_DISCOVERY" ? "selected" : ""}>
              <input type="radio" name="creativity-profile" value="BREAKTHROUGH_DISCOVERY" checked={value.creativity_profile === "BREAKTHROUGH_DISCOVERY"} onChange={() => update("creativity_profile", "BREAKTHROUGH_DISCOVERY")} />
              <span><strong>Breakthrough</strong><small>{ko ? "가정 전환과 교차 분야 기전을 먼저 탐색합니다. 별도 승인된 런타임에서만 실행됩니다." : "Explores assumption inversions and cross-domain mechanisms first. Execution requires an independently approved runtime."}</small></span>
            </label>
          </div>
        </fieldset>

        <label className="literature-scope-toggle">
          <input type="checkbox" checked={value.literature_scope_enabled} onChange={(event) => update("literature_scope_enabled", event.target.checked)} />
          <span>{ko ? "문헌 검토와 출처 원장 포함" : "Include literature review and source ledger"}</span>
        </label>

        <label className="reference-request-field">
          <span>{ko ? "참고 문헌과 추가 제약" : "Reference material and additional constraints"}</span>
          <textarea rows={4} value={value.reference_material_or_constraints} onChange={(event) => update("reference_material_or_constraints", event.target.value)} />
          <small>{ko ? "핵심 논문, DOI, 기존 결과, 제외할 접근법을 적어주세요." : "Add key papers, DOI, prior results, or approaches to exclude."}</small>
        </label>

        <div className="run-request-actions">
          <button className="primary-button" type="submit" disabled={!ready || busy || !runControlApiBase}>
            {busy ? <LoaderCircle className="spin" size={18} /> : <FlaskConical size={18} />}
            {ko ? "연구 계획 확인" : "Review research plan"}
          </button>
        </div>
        <p className="research-entry-note">
          {ko ? "이 단계에서는 외부 모델 호출이나 비용이 발생하지 않습니다." : "This stage does not call an external model or incur provider cost."}
        </p>
        {!runControlApiBase && <div className="intake-message" role="status"><p>{ko ? "연구 실행 기능은 준비 중입니다." : "Research execution is being prepared."}</p></div>}

        {message && (
          <div className="intake-message" role={authRequired ? "status" : "alert"}>
            <p>{message}</p>
            {authRequired && <a className="secondary-button" href={`${runControlApiBase}/api/session`}><LogIn size={17} />Cloudflare Access</a>}
          </div>
        )}

        <details className="advanced-fields">
          <summary>{ko ? "고급 설정과 요청 파일" : "Advanced settings and request file"}</summary>
          <div>
            <label><span>{ko ? "제목" : "Title"}</span><input value={value.title} onChange={(event) => update("title", event.target.value)} /></label>
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
      </form>

      {showPreview && (
        <aside className="spec-preview">
          <p className="section-label">{ko ? "요청 미리보기" : "Request preview"}</p>
          <h2>{value.title.trim() || deriveRequestTitle(value.raw_research_request) || (ko ? "연구 요청" : "Research request")}</h2>
          <div className="rendered-brief">
            <section><h3>{ko ? "질문" : "Question"}</h3><p>{value.raw_research_request}</p></section>
            {value.research_goal && <section><h3>{ko ? "목표" : "Objectives"}</h3><p>{value.research_goal}</p></section>}
            {value.experimental_constraints && <section><h3>{ko ? "제약" : "Constraints"}</h3><p>{value.experimental_constraints}</p></section>}
            <section><h3>{ko ? "프로필" : "Profile"}</h3><p>{value.creativity_profile}</p></section>
            <section><h3>{ko ? "문헌 범위" : "Literature scope"}</h3><p>{value.literature_scope_enabled ? (ko ? "포함" : "Included") : (ko ? "제외" : "Excluded")}</p></section>
            <section><h3>{ko ? "실행 전 확인" : "Confirmation before execution"}</h3><p>{ko ? "무비용 사전 검토가 실행 모드와 예산 상한을 먼저 보여줍니다. 명시적으로 승인하기 전에는 provider 기반 연구가 시작되지 않습니다." : "A zero-provider preflight shows the run mode and budget ceilings first. Provider-backed research does not start before explicit approval."}</p></section>
          </div>
        </aside>
      )}
    </div>
  );
}
