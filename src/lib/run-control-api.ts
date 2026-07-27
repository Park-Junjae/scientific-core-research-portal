export const runControlApiBase = (
  process.env.NEXT_PUBLIC_RUN_CONTROL_API_BASE ?? ""
).replace(/\/+$/, "");

export type RunControlStatus =
  | "QUEUED"
  | "RUNNER_OFFLINE"
  | "QUEUE_EXPIRED"
  | "PREFLIGHT"
  | "AWAITING_APPROVAL"
  | "RUNNING"
  | "GENERATING_REPORTS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface RunControlSession {
  authenticated: true;
  email: string;
  csrf_token: string;
}

export interface CompiledRunContract {
  contract_version: string;
  run_id: string;
  run_mode: string;
  include_literature_list_and_review_scope: boolean;
  source_boundary: string;
  contamination_boundary: string;
  budget: {
    expected_successful_calls: number;
    hard_cap_successful_calls: number;
    successful_calls: number;
    expected_attempts: number;
    hard_cap_attempts: number;
    attempts: number;
    expected_input_tokens: number;
    hard_cap_input_tokens: number;
    input_tokens: number;
    expected_output_tokens: number;
    hard_cap_output_tokens: number;
    output_tokens: number;
    expected_cost_usd: number;
    hard_cap_cost_usd: number;
    cost_usd: number;
    expected_wall_clock_seconds: number;
    hard_cap_wall_clock_seconds: number;
    wall_clock_seconds: number;
    transient_retries: number;
  };
  generation_plan: {
    raw_idea_minimum: number;
    raw_idea_target: number;
    raw_idea_target_range: [number, number];
    mechanism_family_target_range: [number, number];
    finalist_range: [number, number];
    no_forced_finalist: boolean;
    natural_family_grouping: boolean;
  };
  excluded_generation_context: string[];
  reporting: {
    language_priority: string;
    bilingual_pdf_required: boolean;
    complete_source_ledger_required: boolean;
    publication_target: string;
  };
  orchestration: {
    canonical_orchestrator_only: boolean;
    maximum_scientific_writers: number;
    explicit_budget_approval_required: boolean;
    silent_scope_truncation_forbidden: boolean;
  };
  runtime_ref: string;
  target_runner: string;
  output_root_policy: string;
  stop_rules: string[];
  material_inferences: Array<{
    field: string;
    from: unknown;
    to: unknown;
    material: boolean;
    reason: string;
  }>;
  requires_user_confirmation: boolean;
  creativity_profile?: "BREAKTHROUGH_DISCOVERY";
  raw_spark_target?: number;
  stage_order?: string[];
  budget_sufficiency?: {
    sufficient: boolean;
    required_profile: string;
    reduced_target_requires_explicit_approval: boolean;
    silent_truncation_allowed: false;
    provider_price_source: string;
  };
}

export interface RunControlRecord {
  run_id: string;
  creator: string;
  created_at: string;
  updated_at: string;
  status: RunControlStatus;
  request_sha256: string;
  budget_profile: string;
  runtime_ref: string;
  queue_expires_at: string;
  compiled_contract: CompiledRunContract | null;
  result_locator: string | null;
  safe_message: string;
}

export interface RunControlEvent {
  schema_version: "ScientificCoreRunStatusEventV2";
  run_id: string;
  event_id: string;
  sequence: number;
  nonce: string;
  stage: string;
  status: string;
  timestamp: string;
  progress: number;
  cumulative_usage: {
    calls: number;
    attempts: number;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
  message: string;
}

export interface PrivateArtifact {
  artifact_id: string;
  run_id: string;
  role: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  status: "PENDING" | "AVAILABLE";
}

export interface PrivateRunBundle {
  manifest: {
    schema_version: string;
    run_id: string;
    artifacts: PrivateArtifact[];
  };
  manifest_sha256: string;
  created_at: string;
  artifacts: PrivateArtifact[];
}

export class RunControlApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface ControlledRunPayloadInput {
  researchQuestion: string;
  objectives: string[];
  constraints: string[];
  requestedMode: string;
  creativityProfile: "STANDARD" | "BREAKTHROUGH_DISCOVERY";
}

export function buildControlledRunPayload(input: ControlledRunPayloadInput) {
  const breakthrough = input.creativityProfile === "BREAKTHROUGH_DISCOVERY";
  return {
    research_question: input.researchQuestion,
    objectives: input.objectives,
    constraints: input.constraints,
    requested_mode: breakthrough ? "DISCOVERY_PORTFOLIO_RUN" : input.requestedMode,
    include_literature_list_and_review_scope: true,
    execution_mode: "PROVIDER_BACKED",
    budget_profile: breakthrough ? "breakthrough_discovery" : "standard",
    ...(breakthrough
      ? {
          creativity_profile: "BREAKTHROUGH_DISCOVERY",
          creativity_profile_selection_reviewed: true,
          raw_spark_target: 60,
        }
      : {}),
  };
}

async function request<T>(
  pathname: string,
  init: RequestInit = {},
): Promise<T> {
  if (!runControlApiBase) {
    throw new RunControlApiError("Run Control API is not configured.", 503);
  }
  const response = await fetch(`${runControlApiBase}${pathname}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      detail = (await response.json()).detail ?? detail;
    } catch {
      // The status code remains the authoritative error signal.
    }
    throw new RunControlApiError(detail, response.status);
  }
  try {
    return await response.json() as T;
  } catch {
    throw new RunControlApiError("Run Control API returned an invalid response.", 502);
  }
}

export function getRunControlSession() {
  return request<RunControlSession>("/api/session");
}

export function createControlledRun(
  payload: Record<string, unknown>,
  csrfToken: string,
) {
  return request<RunControlRecord>("/api/runs", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify(payload),
  });
}

export function getControlledRun(runId: string) {
  return request<RunControlRecord>(`/api/runs/${encodeURIComponent(runId)}`);
}

export async function getControlledRunEvents(runId: string) {
  const result = await request<{ events: RunControlEvent[] }>(
    `/api/runs/${encodeURIComponent(runId)}/events`,
  );
  return result.events;
}

export function getScientificRunner() {
  return request<{ runner: string; online: boolean; fallback_runner: null }>(
    "/api/runners/scientific-core-vm",
  );
}

export function approveControlledRun(runId: string, csrfToken: string) {
  return request<RunControlRecord>(
    `/api/runs/${encodeURIComponent(runId)}/approve`,
    { method: "POST", headers: { "X-CSRF-Token": csrfToken } },
  );
}

export function cancelControlledRun(runId: string, csrfToken: string) {
  return request<RunControlRecord>(
    `/api/runs/${encodeURIComponent(runId)}/cancel`,
    { method: "POST", headers: { "X-CSRF-Token": csrfToken } },
  );
}

export function redispatchControlledRun(runId: string, csrfToken: string) {
  return request<RunControlRecord>(
    `/api/runs/${encodeURIComponent(runId)}/redispatch`,
    { method: "POST", headers: { "X-CSRF-Token": csrfToken } },
  );
}

export function getPrivateRunBundle(runId: string) {
  return request<PrivateRunBundle>(`/api/runs/${encodeURIComponent(runId)}/bundle`);
}

export async function readPrivateArtifact(runId: string, artifactId: string) {
  if (!runControlApiBase) {
    throw new RunControlApiError("Run Control API is not configured.", 503);
  }
  const response = await fetch(
    `${runControlApiBase}/api/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}/download`,
    { credentials: "include" },
  );
  if (!response.ok) {
    throw new RunControlApiError("Unable to read private artifact.", response.status);
  }
  return response.blob();
}
