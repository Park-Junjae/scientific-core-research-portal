export const runControlApiBase = (
  process.env.NEXT_PUBLIC_RUN_CONTROL_API_BASE ?? ""
).replace(/\/+$/, "");

export const PORTAL_SELECTABLE_RUN_MODES = [
  "AUTO",
  "FOCUSED_DECISION_RUN",
  "DISCOVERY_PORTFOLIO_RUN",
] as const;

export type PortalSelectableRunMode = typeof PORTAL_SELECTABLE_RUN_MODES[number];

export const RUN_STATUS_POLL_INTERVALS_MS = {
  STARTING: 2_000,
  QUEUED: 3_000,
  RUNNING: 5_000,
  GENERATING_REPORTS: 5_000,
} as const;
export const BACKEND_RATE_LIMIT_PER_MINUTE = 30;
export const DEFAULT_RATE_LIMIT_BACKOFF_MS = 60_000;
export function sustainedStatusRequestsPerMinute(
  intervalMs = RUN_STATUS_POLL_INTERVALS_MS.STARTING,
) {
  return Math.ceil(60_000 / intervalMs);
}

export type RunControlStatus =
  | "STARTING"
  | "EXECUTION_DISABLED"
  | "QUEUED"
  | "RUNNING"
  | "GENERATING_REPORTS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface RunControlSession {
  authenticated: true;
  email: string;
  csrf_token: string;
  recent_authentication?: boolean;
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

export interface LiteratureCounts {
  schema_version: string;
  status: string;
  discovered: number;
  title_abstract_screened: number;
  full_text_reviewed: number;
  deeply_read: number;
  analyzed_unique_total: number;
  load_bearing_sources: number;
  unique_cited_sources: number;
  final_reference_count: number;
  report_reference_count: number;
  unique_source_count?: number;
  deduplicated_records?: number;
  source_ledger_schema?: string;
}

export interface ArtifactAvailability {
  available: boolean;
  count: number;
  roles: string[];
}

export interface RunControlRecord {
  run_id: string;
  display_title: string;
  research_question: string;
  creativity_profile: "STANDARD" | "BREAKTHROUGH_DISCOVERY";
  creator: string;
  created_at: string;
  updated_at: string;
  status: RunControlStatus;
  request_sha256: string;
  budget_profile: string;
  runtime_ref: string;
  queue_expires_at: string | null;
  queue_expiry?: string | null;
  compiled_contract: CompiledRunContract | null;
  result_locator: string | null;
  safe_message: string;
  current_stage: string;
  last_event_sequence: number;
  progress_percentage: number;
  raw_idea_count: number;
  independent_idea_count: number;
  family_count: number;
  developed_proposal_count: number;
  literature_analyzed_count: number;
  cited_source_count: number;
  literature_counts: LiteratureCounts;
  elapsed_time_seconds: number;
  provider_cost_usd: number;
  runner_state: "ONLINE" | "OFFLINE" | "UNKNOWN";
  cancellation_state: "NOT_REQUESTED" | "REQUESTED" | "CANCELLED";
  artifact_availability: ArtifactAvailability;
  archived_at?: string | null;
  archived_by?: string | null;
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
  raw_idea_count?: number;
  independent_idea_count?: number;
  family_count?: number;
  developed_proposal_count?: number;
  cumulative_usage: {
    calls: number;
    attempts: number;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
  message: string;
}

export interface CreatorRunListItem {
  run_id: string;
  display_title?: string;
  research_question?: string;
  created_at: string;
  updated_at: string;
  status: RunControlStatus;
  current_stage: string;
  progress_percentage: number;
  creativity_profile: "STANDARD" | "BREAKTHROUGH_DISCOVERY";
  budget_profile: string;
  literature_analyzed_count: number;
  cited_source_count: number;
  literature_counts: LiteratureCounts;
  provider_cost_usd: number;
  artifact_availability: ArtifactAvailability;
  archived_at: string | null;
  archived_by: string | null;
  archive_category: "creator_archived" | "system_validation" | null;
}

export interface CreatorRunListResponse {
  runs: CreatorRunListItem[];
  limit: number;
  offset: number;
  next_offset: number | null;
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
  metadata?: {
    language?: string;
    page_count?: number;
    reference_count?: number;
    updated_at?: string;
    title?: string;
  };
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

export type RunControlApiErrorKind =
  | "NOT_CONFIGURED"
  | "ACCESS_CHALLENGE"
  | "NETWORK"
  | "BACKEND_UNAUTHENTICATED"
  | "NOT_ALLOWLISTED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "HTTP";

export class RunControlApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kind: RunControlApiErrorKind = "HTTP",
    readonly retryAfterMs = 0,
  ) {
    super(message);
    this.name = "RunControlApiError";
  }
}

export interface ControlledRunPayloadInput {
  researchQuestion: string;
  objectives: string[];
  constraints: string[];
  requestedMode: PortalSelectableRunMode;
  creativityProfile: "STANDARD" | "BREAKTHROUGH_DISCOVERY";
  includeLiteratureScope: boolean;
  reportLanguage: string;
}

export function buildControlledRunPayload(input: ControlledRunPayloadInput) {
  const breakthrough = input.creativityProfile === "BREAKTHROUGH_DISCOVERY";
  return {
    research_question: input.researchQuestion,
    objectives: input.objectives,
    constraints: input.constraints,
    requested_mode: breakthrough
      ? "DISCOVERY_PORTFOLIO_RUN"
      : "AUTO",
    include_literature_list_and_review_scope: input.includeLiteratureScope,
    execution_mode: "PROVIDER_BACKED",
    budget_profile: breakthrough ? "breakthrough_discovery" : "standard",
    report_language: input.reportLanguage,
    ...(breakthrough
      ? {
          creativity_profile: "BREAKTHROUGH_DISCOVERY",
          creativity_profile_selection_reviewed: true,
          raw_spark_target: 60,
        }
      : {}),
  };
}

function retryAfterMilliseconds(response: Response) {
  const value = response.headers?.get("retry-after") ?? "";
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : DEFAULT_RATE_LIMIT_BACKOFF_MS;
}

async function responseBody(response: Response) {
  let raw = "";
  let parsed: unknown;
  if (typeof response.text === "function") {
    raw = await response.text();
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = undefined;
      }
    }
  } else if (typeof response.json === "function") {
    try {
      parsed = await response.json();
    } catch {
      parsed = undefined;
    }
  }
  return { raw, parsed };
}

function detailFrom(parsed: unknown, fallback: string) {
  if (
    parsed
    && typeof parsed === "object"
    && "detail" in parsed
    && typeof (parsed as { detail?: unknown }).detail === "string"
  ) {
    return (parsed as { detail: string }).detail;
  }
  return fallback;
}

async function request<T>(
  pathname: string,
  init: RequestInit = {},
): Promise<T> {
  if (!runControlApiBase) {
    throw new RunControlApiError(
      "Run Control API is not configured.",
      503,
      "NOT_CONFIGURED",
    );
  }

  let response: Response;
  try {
    const requestInit: RequestInit = {
      ...init,
      credentials: "include",
    };
    if (init.body !== undefined && init.body !== null) {
      const headers = new Headers(init.headers);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      requestInit.headers = headers;
    }
    response = await fetch(`${runControlApiBase}${pathname}`, requestInit);
  } catch {
    throw new RunControlApiError(
      "Unable to reach the Run Control API. Check the network and browser cross-origin access.",
      0,
      "NETWORK",
    );
  }

  const contentType = response.headers?.get("content-type")?.toLowerCase() ?? "";
  const { raw, parsed } = await responseBody(response);
  const html = contentType.includes("text/html")
    || /^\s*(?:<!doctype\s+html|<html\b)/i.test(raw);
  if (response.redirected || html) {
    throw new RunControlApiError(
      "Cloudflare Access requires a browser session.",
      response.status || 302,
      "ACCESS_CHALLENGE",
    );
  }

  if (!response.ok) {
    const detail = detailFrom(parsed, response.statusText || "Run Control request failed.");
    if (response.status === 401) {
      throw new RunControlApiError(detail, 401, "BACKEND_UNAUTHENTICATED");
    }
    if (response.status === 403) {
      const kind = /allowlist/i.test(detail) ? "NOT_ALLOWLISTED" : "FORBIDDEN";
      throw new RunControlApiError(detail, 403, kind);
    }
    if (response.status === 429) {
      throw new RunControlApiError(
        detail,
        429,
        "RATE_LIMITED",
        retryAfterMilliseconds(response),
      );
    }
    if (response.status >= 500) {
      throw new RunControlApiError(detail, response.status, "UNAVAILABLE");
    }
    throw new RunControlApiError(detail, response.status, "HTTP");
  }

  if (parsed === undefined) {
    throw new RunControlApiError(
      "Run Control API returned an invalid non-JSON response.",
      502,
      "INVALID_RESPONSE",
    );
  }
  return parsed as T;
}

export function getRunControlSession() {
  return request<RunControlSession>("/api/session");
}

export function getMyRuns(limit = 20, offset = 0, archived = false) {
  return request<CreatorRunListResponse>(
    `/api/runs?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}&archived=${archived}`,
  );
}

export function createControlledRun(
  payload: Record<string, unknown>,
  csrfToken: string,
  requestLocator?: string,
) {
  return request<RunControlRecord>("/api/runs", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
    body: JSON.stringify({
      ...payload,
      ...(requestLocator ? { request_locator: requestLocator } : {}),
    }),
  });
}

export function getControlledRun(runId: string) {
  return request<RunControlRecord>(`/api/runs/${encodeURIComponent(runId)}`);
}

export async function getControlledRunEvents(
  runId: string,
  afterSequence = 0,
) {
  const result = await request<{ events: RunControlEvent[] }>(
    `/api/runs/${encodeURIComponent(runId)}/events?after_sequence=${encodeURIComponent(afterSequence)}`,
  );
  return result.events;
}

export function cancelControlledRun(runId: string, csrfToken: string) {
  return request<RunControlRecord>(
    `/api/runs/${encodeURIComponent(runId)}/cancel`,
    { method: "POST", headers: { "X-CSRF-Token": csrfToken } },
  );
}

export function archiveControlledRun(runId: string, csrfToken: string) {
  return request<RunControlRecord>(
    `/api/runs/${encodeURIComponent(runId)}/archive`,
    { method: "POST", headers: { "X-CSRF-Token": csrfToken } },
  );
}

export function restoreControlledRun(runId: string, csrfToken: string) {
  return request<RunControlRecord>(
    `/api/runs/${encodeURIComponent(runId)}/restore`,
    { method: "POST", headers: { "X-CSRF-Token": csrfToken } },
  );
}

export interface RunDeletionResponse {
  status: "DELETED" | "PENDING_OBJECT_DELETE";
  run_id: string;
  deletion_timestamp?: string;
  remaining_object_count?: number;
}

export function deleteControlledRun(
  runId: string,
  csrfToken: string,
  idempotencyKey: string,
  deletionReason = "creator_requested_cleanup",
) {
  return request<RunDeletionResponse>(
    `/api/runs/${encodeURIComponent(runId)}`,
    {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": csrfToken,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        confirmation_token: runId,
        deletion_reason: deletionReason,
      }),
    },
  );
}

export function getPrivateRunBundle(runId: string) {
  return request<PrivateRunBundle>(`/api/runs/${encodeURIComponent(runId)}/bundle`);
}

export async function getPrivateArtifacts(runId: string) {
  const result = await request<{ artifacts: PrivateArtifact[] }>(
    `/api/runs/${encodeURIComponent(runId)}/artifacts`,
  );
  return result.artifacts;
}

export function privateArtifactUrl(
  runId: string,
  artifactId: string,
  disposition: "inline" | "attachment" = "attachment",
) {
  return `${runControlApiBase}/api/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}/download?disposition=${disposition}`;
}

export async function readPrivateArtifact(
  runId: string,
  artifactId: string,
  disposition: "inline" | "attachment" = "inline",
) {
  if (!runControlApiBase) {
    throw new RunControlApiError(
      "Run Control API is not configured.",
      503,
      "NOT_CONFIGURED",
    );
  }
  let response: Response;
  try {
    response = await fetch(
      privateArtifactUrl(runId, artifactId, disposition),
      { credentials: "include" },
    );
  } catch {
    throw new RunControlApiError(
      "Unable to reach the private artifact reader.",
      0,
      "NETWORK",
    );
  }
  if (!response.ok) {
    throw new RunControlApiError(
      "Unable to read private artifact.",
      response.status,
      response.status >= 500 ? "UNAVAILABLE" : "HTTP",
    );
  }
  return response.blob();
}
