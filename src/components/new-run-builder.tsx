"use client";

import { Check, FileJson, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale } from "@/lib/locale";
import {
  buildRunRequest,
  defaultRequestedOutputs,
  deriveRequestTitle,
  initialRunRequest,
  normalizeImportedRequest,
  type RunRequestDraft,
} from "@/lib/run-request";

function downloadRequest(body: unknown) {
  const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "run-request.json";
  anchor.click();
  URL.revokeObjectURL(url);
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
  const [importMessage, setImportMessage] = useState("");
  const request = useMemo(() => buildRunRequest(value, locale), [locale, value]);
  const ready = Boolean(value.raw_research_request.trim());
  const showPreview = Boolean(
    value.raw_research_request.trim()
    || value.reference_material_or_constraints.trim()
    || request.structured_fields,
  );

  const update = <K extends keyof RunRequestDraft>(key: K, next: RunRequestDraft[K]) => {
    setSaved(false);
    setValue((current) => ({ ...current, [key]: next }));
  };

  const labels = ko
    ? {
        raw: "무엇을 연구하고 싶나요?",
        rawHelp: "연구 질문, 현재 고민, 원하는 방향을 자유롭게 작성하세요.",
        references: "문헌 검토 범위와 반드시 지켜야 할 조건",
        referencesHelp: "핵심 논문, DOI, 검토할 문헌 범위, 기존 결과, 실험 조건 또는 제외할 접근을 적어주세요.",
        create: "요청서 저장",
        saved: "요청 저장됨",
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
        preview: "연구 요청",
        imported: "기존 요청서를 불러왔습니다.",
        importError: "요청서 형식을 확인할 수 없습니다.",
      }
    : {
        raw: "What would you like to research?",
        rawHelp: "Describe the research question, current concern, and desired direction in your own words.",
        references: "Literature scope and constraints to preserve",
        referencesHelp: "Add key papers, DOIs, literature scope, prior results, experimental constraints, or approaches to exclude.",
        create: "Save request file",
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
        preview: "Research Request",
        imported: "Existing request loaded.",
        importError: "The request format could not be read.",
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

  return (
    <div className={`intake-layout${showPreview ? " has-preview" : ""}`}>
      <form
        className="intake-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!ready) return;
          downloadRequest(request);
          setSaved(true);
        }}
      >
        <p className="intake-scope">
          {ko
            ? "이 화면에서는 요청서 파일만 준비합니다. 외부 모델 실행과 비용 사용은 별도 점검 및 승인 전에는 시작되지 않습니다."
            : "This page prepares a request file only. External model execution and provider spending require separate preflight and approval."}
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
                    setImportMessage(labels.imported);
                  } catch {
                    setImportMessage(labels.importError);
                  }
                }}
              />
            </label>
            {importMessage && <p className="import-status" role="status">{importMessage}</p>}
          </div>
        </details>

        <div className="run-request-actions">
          <button className="primary-button" type="submit" disabled={!ready}>
            {saved ? <Check size={18} /> : <FileJson size={18} />}
            {saved ? labels.saved : labels.create}
          </button>
          {!ready && (
            <small className="run-request-hint">
              {ko
                ? "연구 질문을 입력하면 요청서를 저장할 수 있습니다."
                : "Describe the research question to enable saving."}
            </small>
          )}
        </div>
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
              <h4>{ko ? "기본 산출물" : "Default outputs"}</h4>
              <ul>{defaultRequestedOutputs(locale).map((output) => <li key={output}>{output}</li>)}</ul>
            </section>
            <section>
              <h4>{ko ? "실행 전 확인" : "Confirmation before execution"}</h4>
              <p>
                {ko
                  ? "Scientific Director가 전체 연구 명세와 불명확한 가정을 정리해 보여준 뒤 멈춥니다. 사용자가 확인하기 전에는 provider 기반 연구를 시작하지 않습니다."
                  : "The Scientific Director compiles the full specification and ambiguous assumptions, presents them, and stops. Provider-backed research starts only after user confirmation."}
              </p>
            </section>
          </div>
          <small className="preview-footnote">
            {ko ? "이 정적 화면은 연구 실행을 시작하지 않습니다." : "This static page does not start a scientific run."}
          </small>
        </aside>
      )}
    </div>
  );
}
