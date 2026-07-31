import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider } from "@/lib/preferences";
import { RunControlPanel } from "./run-control-panel";

/* The execution screen is what a creator watches for the length of a run, and
   it had no coverage. These render it with the shapes the Backend actually
   sends, including the stage names PR #17 introduces. */

const apiMocks = vi.hoisted(() => ({
  getControlledRun: vi.fn(),
  getControlledRunEvents: vi.fn(),
  getRunControlSession: vi.fn(),
  cancelControlledRun: vi.fn(),
  getPrivateArtifacts: vi.fn(),
  readPrivateArtifact: vi.fn(),
}));
const localeMock = vi.hoisted(() => ({ current: "ko" as "ko" | "en" }));

vi.mock("@/lib/run-control-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/run-control-api")>();
  return {
    ...actual,
    ...apiMocks,
    runControlApiBase: "https://control.example",
    RUN_STATUS_POLL_INTERVALS_MS: { RUNNING: 100000 },
  };
});
vi.mock("@/lib/locale", () => ({
  useLocale: () => ({ locale: localeMock.current, t: (k: string) => k }),
}));
vi.mock("@/lib/paths", () => ({ withBasePath: (v: string) => v }));
vi.mock("@/components/private-run-reader", () => ({ PrivateRunReader: () => null }));

function runRecord(overrides: Record<string, unknown> = {}) {
  return {
    run_id: "run-progress-001",
    display_title: "미토콘드리아 편집 효율",
    research_question: "미토콘드리아 편집 효율이 왜 정체되는가",
    status: "RUNNING",
    current_stage: "blind_multi_lens_ideation",
    progress_percentage: 34,
    safe_message: "연구가 진행 중입니다.",
    creativity_profile: "BREAKTHROUGH_DISCOVERY",
    budget_profile: "breakthrough_discovery",
    runtime_ref: "23be9a6c9734db59f49f640f691fb3a9323447d0",
    cancellation_state: "NONE",
    raw_idea_count: 60,
    independent_idea_count: 52,
    family_count: 0,
    developed_proposal_count: 0,
    literature_analyzed_count: 0,
    cited_source_count: 0,
    provider_cost_usd: 0,
    elapsed_time_seconds: 900,
    ...overrides,
  };
}

function event(stage: string, sequence: number) {
  return {
    schema_version: "ScientificCoreRunStatusEventV2",
    run_id: "run-progress-001",
    event_id: `e${sequence}`,
    sequence,
    nonce: `n${sequence}`,
    stage,
    status: stage.toUpperCase(),
    timestamp: "2026-07-31T00:00:00Z",
    progress: sequence / 10,
    cumulative_usage: { calls: 7, attempts: 8, input_tokens: 31000, output_tokens: 15500, cost_usd: 0.124 },
    message: "stage complete",
  };
}

function mount() {
  return render(<PreferencesProvider><RunControlPanel /></PreferencesProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  localeMock.current = "ko";
  window.history.replaceState({}, "", "/run-control/?run_id=run-progress-001");
  apiMocks.getRunControlSession.mockResolvedValue({
    authenticated: true, email: "creator@example.com", csrf_token: "csrf",
  });
  apiMocks.getControlledRun.mockResolvedValue(runRecord());
  apiMocks.getControlledRunEvents.mockResolvedValue([
    event("runner_accepted", 1),
    event("scientific_framing", 2),
    event("mechanistic_decomposition", 3),
  ]);
  apiMocks.getPrivateArtifacts.mockResolvedValue([]);
});

describe("run execution screen", () => {
  it("names each stage in Korean instead of printing the identifier", async () => {
    mount();

    expect(await screen.findByText("문제 재구성")).toBeInTheDocument();
    expect(screen.getByText("기전 분해")).toBeInTheDocument();
    expect(screen.getByText("다중 렌즈 발상")).toBeInTheDocument();
    expect(screen.getByText("아이디어 동결")).toBeInTheDocument();
  });

  it("never prints a raw stage identifier", async () => {
    mount();
    await screen.findByText("문제 재구성");

    const list = document.querySelector(".stage-progress-list");
    expect(list).toBeTruthy();
    expect(list!.textContent).not.toMatch(/scientific.framing|mechanistic.decomposition|presearch/i);
    expect(list!.textContent).not.toMatch(/_/);
  });

  it("names the stages in English under the English locale", async () => {
    localeMock.current = "en";
    mount();

    expect(await screen.findByText("Reframing the problem")).toBeInTheDocument();
    expect(screen.getByText("Multi-lens ideation")).toBeInTheDocument();
  });

  it("shows the counts the run reports", async () => {
    mount();
    await screen.findByText("문제 재구성");

    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("52")).toBeInTheDocument();
  });
});
