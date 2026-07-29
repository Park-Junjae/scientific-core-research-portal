import type { Page, Route } from "@playwright/test";

export const fixtureRunId = "run-fixture-homepage-0001";
export const fixtureRuntimeRef = "743336b3419bf735caeaaec434074ed512eb0c22";
export const fixtureResearchQuestion = "Which controllable state preserves product purity without sacrificing activity?";
export const fixtureDisplayTitle = "Controllable state for product purity and activity";
export const legacyLongResearchQuestion = [
  "RNA-mediated mitochondrial DNA/RNA base editing.",
  ...Array.from({ length: 120 }, (_, index) => (
    `${index + 1}. Private detailed instruction that must never appear in My Research.`
  )),
].join("\n");

export type FixtureRunStatus =
  | "STARTING"
  | "EXECUTION_DISABLED"
  | "QUEUED"
  | "RUNNING"
  | "GENERATING_REPORTS"
  | "COMPLETED"
  | "CANCELLED";

const session = {
  authenticated: true,
  email: "creator@example.com",
  csrf_token: "fixture-csrf",
};

const literatureCounts = {
  schema_version: "LiteratureCountReconciliationV1",
  status: "COMPLETE",
  discovered: 24,
  title_abstract_screened: 18,
  full_text_reviewed: 12,
  deeply_read: 8,
  analyzed_unique_total: 12,
  load_bearing_sources: 5,
  unique_cited_sources: 8,
  final_reference_count: 8,
  report_reference_count: 8,
};

const budget = {
  expected_successful_calls: 48,
  hard_cap_successful_calls: 72,
  successful_calls: 0,
  expected_attempts: 54,
  hard_cap_attempts: 84,
  attempts: 0,
  expected_input_tokens: 420000,
  hard_cap_input_tokens: 640000,
  input_tokens: 0,
  expected_output_tokens: 160000,
  hard_cap_output_tokens: 240000,
  output_tokens: 0,
  expected_cost_usd: 38,
  hard_cap_cost_usd: 60,
  cost_usd: 0,
  expected_wall_clock_seconds: 7200,
  hard_cap_wall_clock_seconds: 10800,
  wall_clock_seconds: 0,
  transient_retries: 0,
};

export const fixtureContract = {
  contract_version: "CompiledRunContractV1",
  run_id: fixtureRunId,
  run_mode: "DISCOVERY_PORTFOLIO_RUN",
  include_literature_list_and_review_scope: true,
  source_boundary: "creator-private",
  contamination_boundary: "fixture-only",
  budget,
  generation_plan: {
    raw_idea_minimum: 40,
    raw_idea_target: 60,
    raw_idea_target_range: [40, 60],
    mechanism_family_target_range: [5, 8],
    finalist_range: [1, 3],
    no_forced_finalist: true,
    natural_family_grouping: true,
  },
  excluded_generation_context: [],
  reporting: {
    language_priority: "en",
    bilingual_pdf_required: false,
    complete_source_ledger_required: true,
    publication_target: "private_artifact_bundle",
  },
  orchestration: {
    canonical_orchestrator_only: true,
    maximum_scientific_writers: 2,
    explicit_budget_approval_required: true,
    silent_scope_truncation_forbidden: true,
  },
  runtime_ref: fixtureRuntimeRef,
  target_runner: "scientific-core",
  output_root_policy: "private",
  stop_rules: ["Stop at the approved budget ceiling."],
  material_inferences: [{
    field: "requested_mode",
    from: "AUTO",
    to: "DISCOVERY_PORTFOLIO_RUN",
    material: true,
    reason: "Breakthrough Discovery requires portfolio generation.",
  }],
  requires_user_confirmation: true,
  creativity_profile: "BREAKTHROUGH_DISCOVERY",
  raw_spark_target: 60,
  stage_order: [
    "literature_atlas",
    "blind_multi_lens_ideation",
    "mechanism_family_formation",
    "adversarial_review",
    "final_reports",
  ],
  budget_sufficiency: {
    sufficient: true,
    required_profile: "breakthrough_discovery",
    reduced_target_requires_explicit_approval: true,
    silent_truncation_allowed: false,
    provider_price_source: "fixture",
  },
};

export const fixtureArtifacts = [
  {
    artifact_id: "artifact-pdf",
    run_id: fixtureRunId,
    role: "pdf_report",
    filename: "final-report.pdf",
    mime_type: "application/pdf",
    size_bytes: 1200,
    sha256: "a".repeat(64),
    status: "AVAILABLE",
    metadata: {
      title: "Mechanism-first research report",
      language: "en",
      page_count: 12,
      reference_count: 8,
      updated_at: "2026-07-28T01:30:00Z",
    },
  },
  {
    artifact_id: "artifact-markdown",
    run_id: fixtureRunId,
    role: "summary",
    filename: "research-summary.md",
    mime_type: "text/markdown",
    size_bytes: 600,
    sha256: "b".repeat(64),
    status: "AVAILABLE",
  },
  {
    artifact_id: "artifact-bundle",
    run_id: fixtureRunId,
    role: "complete_bundle",
    filename: "complete-bundle.zip",
    mime_type: "application/zip",
    size_bytes: 3000,
    sha256: "c".repeat(64),
    status: "AVAILABLE",
  },
  {
    artifact_id: "artifact-ledger",
    run_id: fixtureRunId,
    role: "source_ledger",
    filename: "source-ledger.json",
    mime_type: "application/json",
    size_bytes: 500,
    sha256: "d".repeat(64),
    status: "AVAILABLE",
  },
  {
    artifact_id: "artifact-manifest",
    run_id: fixtureRunId,
    role: "artifact_manifest",
    filename: "artifact-manifest.json",
    mime_type: "application/json",
    size_bytes: 400,
    sha256: "e".repeat(64),
    status: "AVAILABLE",
  },
];

export function makeRun(
  status: FixtureRunStatus,
  profile: "STANDARD" | "BREAKTHROUGH_DISCOVERY" = "BREAKTHROUGH_DISCOVERY",
) {
  const running = status === "RUNNING";
  const completed = status === "COMPLETED";
  const pending = status === "STARTING";
  const compiledContract = profile === "BREAKTHROUGH_DISCOVERY"
    ? fixtureContract
    : {
        ...fixtureContract,
        run_mode: "FOCUSED_DECISION_RUN",
        creativity_profile: undefined,
        raw_spark_target: undefined,
        generation_plan: {
          ...fixtureContract.generation_plan,
          raw_idea_minimum: 12,
          raw_idea_target: 24,
          raw_idea_target_range: [12, 24],
        },
        material_inferences: [],
      };
  return {
    run_id: fixtureRunId,
    display_title: fixtureDisplayTitle,
    research_question: fixtureResearchQuestion,
    creativity_profile: profile,
    creator: "creator-fixture",
    created_at: "2026-07-28T00:00:00Z",
    updated_at: "2026-07-28T01:30:00Z",
    status,
    request_sha256: "f".repeat(64),
    budget_profile: profile === "BREAKTHROUGH_DISCOVERY" ? "breakthrough_discovery" : "standard",
    runtime_ref: fixtureRuntimeRef,
    queue_expires_at: status === "QUEUED"
      ? "2026-07-29T00:00:00Z"
      : null,
    compiled_contract: pending ? null : compiledContract,
    result_locator: completed ? "private" : null,
    safe_message: status === "STARTING"
      ? "Validating the private research launch."
      : status === "EXECUTION_DISABLED"
        ? "Research is ready, but execution is intentionally disabled."
      : status === "QUEUED"
        ? "Research execution is queued."
      : completed
        ? "Private research completed and artifacts are ready."
        : running
          ? "Private research is running."
          : status === "CANCELLED"
            ? "This private run was cancelled."
            : "Generating private research reports.",
    current_stage: completed
      ? "completed"
      : running
        ? "blind_multi_lens_ideation"
        : status === "STARTING"
          ? "starting"
          : status === "EXECUTION_DISABLED"
            ? "execution_disabled"
          : status === "QUEUED"
            ? "queued"
            : status === "GENERATING_REPORTS"
              ? "report_generation"
          : status === "CANCELLED"
            ? "cancelled"
            : "running",
    progress_percentage: completed
      ? 100
      : running
        ? 42
        : status === "EXECUTION_DISABLED"
          ? 10
          : pending
            ? 4
            : 82,
    last_event_sequence: running || completed ? 1 : 0,
    raw_idea_count: completed ? 60 : running ? 24 : 0,
    independent_idea_count: completed ? 18 : running ? 7 : 0,
    family_count: completed ? 6 : running ? 2 : 0,
    developed_proposal_count: completed ? 3 : 0,
    literature_analyzed_count: completed ? 12 : running ? 5 : 0,
    cited_source_count: completed ? 8 : 0,
    literature_counts: literatureCounts,
    elapsed_time_seconds: completed ? 7200 : running ? 1800 : 0,
    provider_cost_usd: 0,
    runner_state: "UNKNOWN",
    cancellation_state: status === "CANCELLED" ? "CANCELLED" : "NOT_REQUESTED",
    artifact_availability: {
      available: completed,
      count: completed ? fixtureArtifacts.length : 0,
      roles: completed ? fixtureArtifacts.map((item) => item.role) : [],
    },
  };
}

function listItem(
  status: FixtureRunStatus,
  profile: "STANDARD" | "BREAKTHROUGH_DISCOVERY",
) {
  const run = makeRun(status, profile);
  return {
    run_id: run.run_id,
    display_title: fixtureDisplayTitle,
    created_at: run.created_at,
    updated_at: run.updated_at,
    status: run.status,
    current_stage: run.current_stage,
    progress_percentage: run.progress_percentage,
    creativity_profile: profile,
    budget_profile: run.budget_profile,
    literature_analyzed_count: run.literature_analyzed_count,
    cited_source_count: run.cited_source_count,
    literature_counts: run.literature_counts,
    provider_cost_usd: 0,
    artifact_availability: run.artifact_availability,
  };
}

function fulfillJson(route: Route, value: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(value),
    headers: {
      "Access-Control-Allow-Origin": "http://127.0.0.1:4175",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function seedSubmittedSummary(page: Page) {
  await page.addInitScript(({ runId }) => {
    window.sessionStorage.setItem(`scientific-core-run-draft:${runId}`, JSON.stringify({
      research_question: "Which controllable state preserves product purity without sacrificing activity?",
      objectives: ["Identify a discriminating mechanism", "Preserve product activity"],
      constraints: ["Use fixture evidence only", "Keep provider usage at zero"],
      selected_mode: "DISCOVERY_PORTFOLIO_RUN",
      creativity_profile: "BREAKTHROUGH_DISCOVERY",
      literature_scope: true,
      report_language: "en",
    }));
  }, { runId: fixtureRunId });
}

export async function installPrivateWorkspaceRoutes(
  page: Page,
  initialStatus: FixtureRunStatus = "STARTING",
  options: {
    list?: "empty" | "current" | "legacy-long";
    captureDownloads?: boolean;
    failFirstPost?: boolean;
    postDelayMs?: number;
  } = {},
) {
  let status = initialStatus;
  let submittedBody: Record<string, unknown> | null = null;
  let profile: "STANDARD" | "BREAKTHROUGH_DISCOVERY" = "BREAKTHROUGH_DISCOVERY";
  let runnerApiCalls = 0;
  let artifactDownloads = 0;
  let postCount = 0;
  let postFailed = false;
  let eventApiCalls = 0;
  let statusApiCalls = 0;

  await page.route("https://control.example/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname.includes("/actions/runners")) runnerApiCalls += 1;
    if (url.pathname === "/api/session") return fulfillJson(route, session);
    if (url.pathname === "/api/runs" && method === "GET") {
      const listed = listItem(status, profile);
      const runs = options.list === "current"
        ? [listed]
        : options.list === "legacy-long"
          ? [{
              ...listed,
              display_title: undefined,
              research_question: legacyLongResearchQuestion,
            }]
          : [];
      return fulfillJson(route, {
        runs,
        limit: 20,
        offset: 0,
        next_offset: null,
      });
    }
    if (url.pathname === "/api/runs" && method === "POST") {
      postCount += 1;
      if (options.postDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, options.postDelayMs));
      }
      if (options.failFirstPost && !postFailed) {
        postFailed = true;
        return route.abort("connectionfailed");
      }
      submittedBody = request.postDataJSON() as Record<string, unknown>;
      profile = submittedBody.creativity_profile === "BREAKTHROUGH_DISCOVERY"
        ? "BREAKTHROUGH_DISCOVERY"
        : "STANDARD";
      status = "STARTING";
      return fulfillJson(route, makeRun(status, profile));
    }
    if (url.pathname === `/api/runs/${fixtureRunId}`) {
      statusApiCalls += 1;
      return fulfillJson(route, makeRun(status, profile));
    }
    if (url.pathname === `/api/runs/${fixtureRunId}/events`) {
      eventApiCalls += 1;
      const afterSequence = Number(
        url.searchParams.get("after_sequence") ?? "0",
      );
      const hasEvent = (status === "RUNNING" || status === "COMPLETED")
        && afterSequence < 1;
      return fulfillJson(route, {
        events: hasEvent
          ? [{
              schema_version: "ScientificCoreRunStatusEventV2",
              run_id: fixtureRunId,
              event_id: "event-fixture-1",
              sequence: 1,
              nonce: "fixture",
              stage: status === "COMPLETED" ? "final_reports" : "blind_multi_lens_ideation",
              status,
              timestamp: "2026-07-28T01:00:00Z",
              progress: status === "COMPLETED" ? 1 : 0.42,
              cumulative_usage: {
                calls: 0,
                attempts: 0,
                input_tokens: 0,
                output_tokens: 0,
                cost_usd: 0,
              },
              message: status === "COMPLETED" ? "Fixture artifacts are ready." : "Fixture execution is in progress.",
            }]
          : [],
      });
    }
    if (url.pathname === `/api/runs/${fixtureRunId}/cancel` && method === "POST") {
      status = "CANCELLED";
      return fulfillJson(route, makeRun(status, profile));
    }
    if (url.pathname === `/api/runs/${fixtureRunId}/bundle`) {
      return fulfillJson(route, {
        manifest: {
          schema_version: "PrivateArtifactManifestV1",
          run_id: fixtureRunId,
          artifacts: fixtureArtifacts,
        },
        manifest_sha256: "9".repeat(64),
        created_at: "2026-07-28T01:30:00Z",
        artifacts: fixtureArtifacts,
      });
    }
    if (url.pathname.includes(`/api/runs/${fixtureRunId}/artifacts/`) && url.pathname.endsWith("/download")) {
      artifactDownloads += 1;
      return route.fulfill({
        status: 200,
        contentType: url.pathname.includes("artifact-pdf") ? "application/pdf" : "application/octet-stream",
        body: url.pathname.includes("artifact-pdf") ? "%PDF-1.4 fixture" : "fixture",
        headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:4175",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }
    return fulfillJson(route, { detail: "not found" }, 404);
  });

  return {
    get status() { return status; },
    setStatus(next: FixtureRunStatus) { status = next; },
    get submittedBody() { return submittedBody; },
    get runnerApiCalls() { return runnerApiCalls; },
    get artifactDownloads() { return artifactDownloads; },
    get postCount() { return postCount; },
    get eventApiCalls() { return eventApiCalls; },
    get statusApiCalls() { return statusApiCalls; },
  };
}
