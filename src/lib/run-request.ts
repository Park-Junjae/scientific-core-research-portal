import type { Locale } from "./types";

export type RequestRunType =
  | ""
  | "DISCOVERY_PORTFOLIO_RUN"
  | "FOCUSED_DECISION_RUN";
export type RequestOutputLanguage = "" | "en" | "ko" | "bilingual";
export type CreativityProfile = "STANDARD" | "BREAKTHROUGH_DISCOVERY";

export interface RunRequestDraft {
  raw_research_request: string;
  reference_material_or_constraints: string;
  title: string;
  run_type: RequestRunType;
  research_question: string;
  research_goal: string;
  current_bottleneck: string;
  experimental_constraints: string;
  success_criteria: string;
  failure_criteria: string;
  non_goals: string;
  custom_requested_outputs: string;
  output_language: RequestOutputLanguage;
  visibility: "PRIVATE" | "LAB_INTERNAL" | "PUBLIC_SANITIZED";
  notes: string;
  creativity_profile: CreativityProfile;
  literature_scope_enabled: boolean;
}

export interface StructuredRunRequestFields {
  title: string;
  run_type: Exclude<RequestRunType, ""> | null;
  research_question: string;
  research_goal: string;
  current_bottleneck: string;
  experimental_constraints: string;
  success_criteria: string;
  failure_criteria: string;
  non_goals: string;
  custom_requested_outputs: string[];
  output_language: Exclude<RequestOutputLanguage, ""> | null;
  visibility: RunRequestDraft["visibility"];
  notes: string;
  literature_scope_enabled: boolean;
}

export const DIRECTOR_CONFIRMATION_PROMPT =
  "Compile this raw research request into the complete Scientific Core structured contract. "
  + "Identify missing or ambiguous assumptions. Present the compiled research specification "
  + "to the user and stop for explicit confirmation. Start provider-backed scientific work "
  + "only after that confirmation. Do not treat this static request file as execution authorization.";

export function initialRunRequest(): RunRequestDraft {
  return {
    raw_research_request: "",
    reference_material_or_constraints: "",
    title: "",
    run_type: "",
    research_question: "",
    research_goal: "",
    current_bottleneck: "",
    experimental_constraints: "",
    success_criteria: "",
    failure_criteria: "",
    non_goals: "",
    custom_requested_outputs: "",
    output_language: "",
    visibility: "PRIVATE",
    notes: "",
    creativity_profile: "STANDARD",
    literature_scope_enabled: true,
  };
}

export function defaultRequestedOutputs(locale: Locale): string[] {
  return locale === "ko"
    ? [
        "과학적 요약",
        "전체 문헌 목록과 검토 범위",
        "연구 아이디어 또는 경쟁 의사결정",
        "비교 및 평가",
        "지식 배경",
        "최종 PDF 보고서",
      ]
    : [
        "Scientific summary",
        "Complete literature list and review scope",
        "Research ideas or competing decisions",
        "Comparison and evaluation",
        "Knowledge Background",
        "Final PDF report",
      ];
}

export function deriveRequestTitle(raw: string): string {
  const first = raw
    .split(/(?:\r?\n)+|(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .find(Boolean) ?? "";
  return first.length > 120 ? `${first.slice(0, 117).trimEnd()}...` : first;
}

function lines(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

export function hasAdvancedOverrides(value: RunRequestDraft): boolean {
  return Boolean(
    value.title.trim()
    || value.run_type
    || value.research_question.trim()
    || value.research_goal.trim()
    || value.current_bottleneck.trim()
    || value.experimental_constraints.trim()
    || value.success_criteria.trim()
    || value.failure_criteria.trim()
    || value.non_goals.trim()
    || value.custom_requested_outputs.trim()
    || value.output_language
    || value.visibility !== "PRIVATE"
    || value.notes.trim()
    || value.literature_scope_enabled === false
  );
}

export function buildRunRequest(
  value: RunRequestDraft,
  locale: Locale,
  createdAt = new Date().toISOString(),
) {
  const structuredFields: StructuredRunRequestFields | null = hasAdvancedOverrides(value)
    ? {
        title: value.title.trim(),
        run_type: value.run_type || null,
        research_question: value.research_question.trim(),
        research_goal: value.research_goal.trim(),
        current_bottleneck: value.current_bottleneck.trim(),
        experimental_constraints: value.experimental_constraints.trim(),
        success_criteria: value.success_criteria.trim(),
        failure_criteria: value.failure_criteria.trim(),
        non_goals: value.non_goals.trim(),
        custom_requested_outputs: lines(value.custom_requested_outputs),
        output_language: value.output_language || null,
        visibility: value.visibility,
        notes: value.notes.trim(),
        literature_scope_enabled: value.literature_scope_enabled,
      }
    : null;

  return {
    schema_version: "RunRequestV2" as const,
    created_at: createdAt,
    raw_research_request: value.raw_research_request.trim(),
    reference_material_or_constraints: value.reference_material_or_constraints.trim(),
    structured_fields: structuredFields,
    requires_director_compilation: true,
    inferred_defaults: {
      title: value.title.trim() || deriveRequestTitle(value.raw_research_request),
      run_type: "AUTO" as const,
      output_language: value.output_language || locale,
      visibility: value.visibility,
      requested_outputs: defaultRequestedOutputs(locale),
    },
    director_launch_prompt: DIRECTOR_CONFIRMATION_PROMPT,
    ...(value.creativity_profile === "BREAKTHROUGH_DISCOVERY"
      ? {
          creativity_profile: "BREAKTHROUGH_DISCOVERY" as const,
          creativity_profile_selection_reviewed: true as const,
        }
      : {}),
  };
}

function validRunType(value: unknown): RequestRunType {
  const allowed: RequestRunType[] = [
    "",
    "DISCOVERY_PORTFOLIO_RUN",
    "FOCUSED_DECISION_RUN",
  ];
  const candidate = String(value ?? "") as RequestRunType;
  return allowed.includes(candidate) ? candidate : "";
}

function validOutputLanguage(value: unknown): RequestOutputLanguage {
  const candidate = String(value ?? "") as RequestOutputLanguage;
  return ["", "en", "ko", "bilingual"].includes(candidate) ? candidate : "";
}

function validVisibility(value: unknown): RunRequestDraft["visibility"] {
  const candidate = String(value ?? "");
  return ["PRIVATE", "LAB_INTERNAL", "PUBLIC_SANITIZED"].includes(candidate)
    ? candidate as RunRequestDraft["visibility"]
    : "PRIVATE";
}

export function normalizeImportedRequest(input: unknown, locale: Locale): RunRequestDraft {
  if (!input || typeof input !== "object") throw new Error("Invalid request file");
  const record = input as Record<string, unknown>;
  const draft = initialRunRequest();

  if (record.schema_version === "RunRequestV2") {
    const structured = record.structured_fields && typeof record.structured_fields === "object"
      ? record.structured_fields as Record<string, unknown>
      : {};
    return {
      ...draft,
      raw_research_request: String(record.raw_research_request ?? ""),
      reference_material_or_constraints: String(record.reference_material_or_constraints ?? ""),
      title: String(structured.title ?? ""),
      run_type: validRunType(structured.run_type),
      research_question: String(structured.research_question ?? ""),
      research_goal: String(structured.research_goal ?? ""),
      current_bottleneck: String(structured.current_bottleneck ?? ""),
      experimental_constraints: String(structured.experimental_constraints ?? ""),
      success_criteria: String(structured.success_criteria ?? ""),
      failure_criteria: String(structured.failure_criteria ?? ""),
      non_goals: String(structured.non_goals ?? ""),
      custom_requested_outputs: Array.isArray(structured.custom_requested_outputs)
        ? structured.custom_requested_outputs.map(String).join("\n")
        : String(structured.custom_requested_outputs ?? ""),
      output_language: validOutputLanguage(structured.output_language),
      visibility: validVisibility(structured.visibility),
      notes: String(structured.notes ?? ""),
      creativity_profile: record.creativity_profile === "BREAKTHROUGH_DISCOVERY"
        ? "BREAKTHROUGH_DISCOVERY"
        : "STANDARD",
      literature_scope_enabled: structured.literature_scope_enabled !== false,
    };
  }

  const preferred = String(record.preferred_output_language ?? "");
  const legacyLanguage: RequestOutputLanguage = preferred === "Korean"
    ? "ko"
    : preferred === "English"
      ? "en"
      : preferred === "Bilingual"
        ? "bilingual"
        : locale;
  const raw = String(
    record.raw_research_request
    ?? record.research_question
    ?? record.research_goal
    ?? record.title
    ?? "",
  );
  const legacyOutputs = Array.isArray(record.requested_outputs)
    ? record.requested_outputs.map(String).join("\n")
    : String(record.requested_outputs ?? "");

  return {
    ...draft,
    raw_research_request: raw,
    reference_material_or_constraints: String(
      record.reference_material_or_constraints ?? record.experimental_constraints ?? "",
    ),
    title: String(record.title ?? ""),
    run_type: validRunType(record.run_mode ?? record.run_type),
    research_question: String(record.research_question ?? ""),
    research_goal: String(record.research_goal ?? ""),
    current_bottleneck: String(record.current_bottleneck ?? ""),
    experimental_constraints: String(record.experimental_constraints ?? ""),
    success_criteria: String(record.success_criteria ?? ""),
    failure_criteria: String(record.failure_criteria ?? ""),
    non_goals: String(record.non_goals ?? ""),
    custom_requested_outputs: legacyOutputs,
    output_language: legacyLanguage,
    visibility: validVisibility(record.visibility),
    notes: String(record.notes ?? ""),
    creativity_profile: record.creativity_profile === "BREAKTHROUGH_DISCOVERY"
      ? "BREAKTHROUGH_DISCOVERY"
      : "STANDARD",
    literature_scope_enabled: record.literature_scope_enabled !== false,
  };
}
