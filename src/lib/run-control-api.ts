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
  login: string;
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
    successful_calls: number;
    attempts: number;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    wall_clock_seconds: number;
    transient_retries: number;
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
  run_id: string;
  stage: string;
  timestamp: string;
  progress: number;
  calls: number;
  attempts: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  message: string;
}

export class RunControlApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
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
  return response.json() as Promise<T>;
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
