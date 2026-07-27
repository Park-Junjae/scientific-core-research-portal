"use client";

import { Check, Download, FlaskConical, LoaderCircle, LogIn, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import {
  buildRunRequest,
  defaultRequestedOutputs,
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

type TextFieldKey =
  | "research_question"
  | "research_goal"
  | "current_bottleneck"
  | "experimental_constraints"
  | "success_criteria"
  | "failure_criteria"
  | "non_goals"
  | "custom_requested_outputs"
  | "notes";

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
  const showPreview = Boolean(
    value.raw_research_request.trim()
    || value.reference_material_or_constraints.trim()
    || request.structured_fields,
  );

  const update = <K extends keyof RunRequestDraft>(key: K, next: RunRequestDraft[K]) => {
    setSaved(false);
    setMessage("");
    setAuthRequired(false);
    setValue((current) => ({ ...current, [key]: next }));
  };

  const labels = ko
    ? {
        raw: "무엇을 연구하고 싶나요?",
        rawHelp: "연구 질문, 현재 고민, 원하는 방향을 자연어로 작성하세요.",
        references: "문헌 검토 범위와 반드시 지켜야 할 조건",
        referencesHelp: "핵심 논문, DOI, 검토할 문헌 범위, 기존 결과, 실험 조건 또는 제외할 접근을 적어주세요.",
        prepare: "연구 실행 준비",
        save: "요청서 저장",
        saved: "요청서 저장됨",
        advanced: "고급 설정",
        title: "제목",
        mode: "연구 유형",
        question: "연구 질문",
        goal: "연구 목표",
        bottleneck: "현재 병목",
        constraints: "실험 제약",
        success: "성공 기준",
        failure: "실패 기준",
        nonGoals: "비목표",
        outputs: "추가 요청 산출물",
        language: "출력 언어",
        visibility: "공개 범위",
        notes: "메모",
        creativity: "아이디어 탐색 방식",
        preview: "연구 요청 미리보기",
        imported: "기존 요청서를 불러왔습니다.",
        importError: "요청서 형식을 확인할 수 없습니다.",
        auth: "직접 실행을 준비하려면 허용된 Cloudflare Access 계정으로 인증해야 합니다.",
        backend: "Run Control API가 아직 배포 환경에 연결되지 않았습니다.",
      }
    : {
        raw: "What would you like to research?",
        rawHelp: "Describe the research question, current concern, and desired direction in your own words.",
        references: "Literature scope and constraints to preserve",
        referencesHelp: "Add key papers, DOIs, literature scope, prior results, experimental constraints, or approaches to exclude.",
        prepare: "Prepare research run",
        save: "Save request",
        saved: "Request saved",
        advanced: "Advanced settings",
        title: "Title",
        mode: "Run type",
        question: "Research question",
        goal: "Research goal",
        bottleneck: "Current bottleneck",
        constraints: "Experimental constraints",
        success: "Success criteria",
        failure: "Failure criteria",
        nonGoals: "Non-goals",
        outputs: "Additional requested outputs",
        language: "Output language",
        visibility: "Visibility",
        notes: "Notes",
        creativity: "Creativity profile",
        preview: "Research request preview",
        imported: "Existing request loaded.",
        importError: "The request format could not be read.",
        auth: "Authenticate with an allowlisted Cloudflare Access account to prepare a direct run.",
        backend: "The Run Control API is not connected in this deployment.",
      };

  const modes: Array<[RunRequestDraft["run_type"], string]> = ko
    ? [
        ["", "자동 선택"],
        ["FOCUSED_DECISION_RUN", "집중 의사결정"],
        ["DISCOVERY_PORTFOLIO_RUN", "탐색 포트폴리오"],
        ["VERIFICATION_RUN", "검증"],
        ["MEASUREMENT_DISCOVERY_RUN", "측정 탐색"],
      ]
    : [
        ["", "Choose automatically"],
        ["FOCUSED_DECISION_RUN", "Focused decision"],
        ["DISCOVERY_PORTFOLIO_RUN", "Discovery portfolio"],
        ["VERIFICATION_RUN", "Verification"],
        ["MEASUREMENT_DISCOVERY_RUN", "Measurement discovery"],
      ];

  const modeLabel = modes.find(([id]) => id === value.run_type)?.[1];
  const title = value.title.trim()
    || deriveRequestTitle(value.raw_research_request)
    || (ko ? "연구 요청" : "Research request");
  const previewSections = [
    [labels.raw, value.raw_research_request],
    [labels.references, value.reference_material_or_constraints],
    [labels.question, value.research_question],
    [labels.goal, value.research_goal],
    [labels.bottleneck, value.current_bottleneck],
    [labels.constraints, value.experimental_constraints],
    [labels.success, value.success_criteria],
    [labels.failure, value.failure_criteria],
    [labels.nonGoals, value.non_goals],
    [labels.notes, value.notes],
  ].filter(([, body]) => body.trim());

  const textField = (key: TextFieldKey, label: string, rows = 3) => (
    <label>
      <span>{label}</span>
      <textarea rows={rows} value={value[key]} onChange={(event) => update(key, event.target.value)} />
    </label>
  );

  async function prepareRun() {
    if (!ready || busy) return;
    if (!runControlApiBase) {
      setMessage(labels.backend);
      return;
    }
    setBusy(true);
    setMessage("");
    setAuthRequired(false);
    try {
      const session = await getRunControlSession();
      const researchQuestion = value.research_question.trim() || value.raw_research_request.trim();
      const objectives = lines(value.research_goal || value.success_criteria);
      const constraints = lines(
        [
          value.reference_material_or_constraints,
          value.experimental_constraints,
          value.failure_criteria,
          value.non_goals,
        ].filter(Boolean).join("\n"),
      );
      const run = await createControlledRun(
        buildControlledRunPayload({
          researchQuestion,
          objectives,
          constraints,
          requestedMode: value.run_type || "AUTO",
          creativityProfile: value.creativity_profile,
        }),
        session.csrf_token,
      );
      window.location.assign(withBasePath(`/run-control/?run_id=${encodeURIComponent(run.run_id)}`));
    } catch (reason) {
      if (reason instanceof RunControlApiError && reason.status === 401) {
        setAuthRequired(true);
        setMessage(labels.auth);
      } else {
        setMessage(reason instanceof Error ? reason.message : "Unable to prepare the run.");
      }
    } finally {
      setBusy(false);
    }
  }

  const loginUrl = runControlApiBase
    ? `${runControlApiBase}/api/session`
    : "#";

  return (
    <div className={`intake-layout${showPreview ? " has-preview" : ""}`}>
      <form
        className="intake-form"
        onSubmit={(event) => {
          event.preventDefault();
          prepareRun();
        }}
      >
        <p className="intake-scope">
          {ko
            ? "먼저 간단히 적어주세요. 실행 전 Scientific Director가 전체 연구 명세와 자동 해석 항목을 정리하고 확인을 요청합니다."
            : "Start with a simple request. Before execution, the Scientific Director compiles the full specification and asks for confirmation."}
        </p>

        <label className="primary-request-field">
          <span>{labels.raw}<b aria-hidden="true"> *</b></span>
          <textarea
            required
            rows={8}
            value={value.raw_research_request}
            onChange={(event) => update("raw_research_request", event.target.value)}
          />
          <small>{labels.rawHelp}</small>
        </label>

        <fieldset className="creativity-selector">
          <legend>{ko ? "아이디어 탐색 방식" : labels.creativity}</legend>
          <div className="creativity-options">
            <label className={value.creativity_profile === "STANDARD" ? "selected" : ""}>
              <input
                type="radio"
                name="creativity-profile"
                value="STANDARD"
                checked={value.creativity_profile === "STANDARD"}
                onChange={() => update("creativity_profile", "STANDARD")}
              />
              <span>
                <strong>{ko ? "표준 연구 탐색" : "Standard research search"}</strong>
                <small>
                  {ko
                    ? "문헌과 근거를 먼저 정리한 뒤 검증 가능한 연구 방향을 발전시킵니다."
                    : "Organizes literature and evidence first, then develops testable research directions."}
                </small>
              </span>
            </label>
            <label className={value.creativity_profile === "BREAKTHROUGH_DISCOVERY" ? "selected" : ""}>
              <input
                type="radio"
                name="creativity-profile"
                value="BREAKTHROUGH_DISCOVERY"
                checked={value.creativity_profile === "BREAKTHROUGH_DISCOVERY"}
                onChange={() => update("creativity_profile", "BREAKTHROUGH_DISCOVERY")}
              />
              <span>
                <strong>{ko ? "돌파형 아이디어 탐색" : "Breakthrough idea search"}</strong>
                <small>
                  {ko
                    ? "문헌 검색 전에 문제를 기전적으로 분해하고, 다른 분야 원리와 제약 반전으로 아이디어를 먼저 만든 뒤 문헌으로 검토합니다. 새로운 발견을 보장하지 않습니다."
                    : "Generates ideas from mechanism decomposition, cross-domain principles, and constraint inversion before literature review. Novelty is not guaranteed."}
                </small>
              </span>
            </label>
          </div>
        </fieldset>

        <div className="run-request-actions">
          <button className="primary-button" type="submit" disabled={!ready || busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : <FlaskConical size={18} />}
            {labels.prepare}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={!ready}
            onClick={() => {
              downloadRequest(request);
              setSaved(true);
            }}
          >
            {saved ? <Check size={18} /> : <Download size={18} />}
            {saved ? labels.saved : labels.save}
          </button>
        </div>

        {message && (
          <div className="intake-message" role={authRequired ? "status" : "alert"}>
            <p>{message}</p>
            {authRequired && (
              <a className="secondary-button" href={loginUrl}>
                <LogIn size={17} /> {ko ? "Cloudflare Access 인증" : "Authenticate with Cloudflare Access"}
              </a>
            )}
          </div>
        )}

        <label className="reference-request-field">
          <span>{labels.references}</span>
          <textarea
            rows={4}
            value={value.reference_material_or_constraints}
            onChange={(event) => update("reference_material_or_constraints", event.target.value)}
          />
          <small>{labels.referencesHelp}</small>
        </label>

        <details className="advanced-fields">
          <summary>{labels.advanced}</summary>
          <div>
            <label><span>{labels.title}</span><input value={value.title} onChange={(event) => update("title", event.target.value)} /></label>
            <label>
              <span>{labels.mode}</span>
              <select value={value.run_type} onChange={(event) => update("run_type", event.target.value as RunRequestDraft["run_type"])}>
                {modes.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            {textField("research_question", labels.question, 4)}
            {textField("research_goal", labels.goal)}
            {textField("current_bottleneck", labels.bottleneck)}
            {textField("experimental_constraints", labels.constraints)}
            {textField("success_criteria", labels.success)}
            {textField("failure_criteria", labels.failure)}
            {textField("non_goals", labels.nonGoals)}
            {textField("custom_requested_outputs", labels.outputs)}
            <div className="two-column-fields">
              <label>
                <span>{labels.language}</span>
                <select value={value.output_language} onChange={(event) => update("output_language", event.target.value as RunRequestDraft["output_language"])}>
                  <option value="">{ko ? "현재 화면 언어" : "Current portal language"}</option>
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="bilingual">{ko ? "한국어 + English" : "Korean + English"}</option>
                </select>
              </label>
              <label>
                <span>{labels.visibility}</span>
                <select value={value.visibility} onChange={(event) => update("visibility", event.target.value as RunRequestDraft["visibility"])}>
                  <option value="PRIVATE">{ko ? "비공개" : "Private"}</option>
                  <option value="LAB_INTERNAL">{ko ? "연구실 내부" : "Lab internal"}</option>
                  <option value="PUBLIC_SANITIZED">{ko ? "검토 후 공개" : "Public after review"}</option>
                </select>
              </label>
            </div>
            {textField("notes", labels.notes)}
            <label className="request-import">
              <span><Upload size={16} />{ko ? "기존 구조화 요청서 불러오기" : "Load an existing structured request"}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    setValue(normalizeImportedRequest(JSON.parse(await file.text()), locale));
                    setMessage(labels.imported);
                  } catch {
                    setMessage(labels.importError);
                  }
                }}
              />
            </label>
          </div>
        </details>
      </form>

      {showPreview && (
        <aside className="spec-preview">
          <p className="section-label">{ko ? "미리보기" : "Preview"}</p>
          <h2>{labels.preview}</h2>
          <div className="rendered-brief">
            <h3>{title}</h3>
            {previewSections.map(([heading, body]) => (
              <section key={heading}>
                <h4>{heading}</h4>
                <p>{body}</p>
              </section>
            ))}
            {value.run_type && <section><h4>{labels.mode}</h4><p>{modeLabel}</p></section>}
            <section>
              <h4>{ko ? "아이디어 탐색 방식" : labels.creativity}</h4>
              <p>
                {value.creativity_profile === "BREAKTHROUGH_DISCOVERY"
                  ? (ko ? "돌파형 아이디어 탐색" : "Breakthrough idea search")
                  : (ko ? "표준 연구 탐색" : "Standard research search")}
              </p>
            </section>
            <section>
              <h4>{ko ? "기본 산출물" : "Default outputs"}</h4>
              <ul>{defaultRequestedOutputs(locale).map((output) => <li key={output}>{output}</li>)}</ul>
            </section>
            <section>
              <h4>{ko ? "실행 전 확인" : "Confirmation before execution"}</h4>
              <p>
                {ko
                  ? "무과금 preflight가 연구 유형, 자동 해석, 문헌 범위, 예산 상한을 먼저 보여줍니다. 명시적으로 승인하기 전에는 provider 기반 연구가 시작되지 않습니다."
                  : "A zero-provider preflight first shows the run type, inferences, literature scope, and budget ceilings. Provider-backed research does not begin without explicit approval."}
              </p>
            </section>
          </div>
          <small className="preview-footnote">
            {ko
              ? "브라우저에는 비밀 키나 인증 토큰이 저장되지 않습니다."
              : "No secret key or authentication token is stored in the browser."}
          </small>
        </aside>
      )}
    </div>
  );
}
