import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreatorRunListItem } from "@/lib/run-control-api";
import { MyResearch } from "./my-research";

const apiMocks = vi.hoisted(() => ({
  getMyRuns: vi.fn(),
  archiveControlledRun: vi.fn(),
  restoreControlledRun: vi.fn(),
  deleteControlledRun: vi.fn(),
}));

const localeMock = vi.hoisted(() => ({ current: "ko" as "ko" | "en" }));

vi.mock("@/lib/run-control-api", () => ({
  ...apiMocks,
  runControlApiBase: "https://control.example",
}));
vi.mock("@/lib/locale", () => ({
  useLocale: () => ({ locale: localeMock.current }),
}));
vi.mock("@/lib/paths", () => ({ withBasePath: (value: string) => value }));

function run(overrides: Partial<CreatorRunListItem> = {}): CreatorRunListItem {
  return {
    run_id: "run-labels-001",
    display_title: "라벨 확인용 연구",
    created_at: "2026-07-31T00:00:00Z",
    updated_at: "2026-07-31T00:00:00Z",
    status: "QUEUED",
    current_stage: "queued",
    progress_percentage: 0,
    creativity_profile: "BREAKTHROUGH_DISCOVERY",
    budget_profile: "breakthrough_discovery",
    literature_analyzed_count: 0,
    cited_source_count: 0,
    literature_counts: {
      schema_version: "LiteratureCountReconciliationV1",
      status: "PENDING",
      discovered: 0,
      title_abstract_screened: 0,
      full_text_reviewed: 0,
      deeply_read: 0,
      analyzed_unique_total: 0,
      load_bearing_sources: 0,
      unique_cited_sources: 0,
      final_reference_count: 0,
      report_reference_count: 0,
    },
    provider_cost_usd: 0,
    artifact_availability: { available: false, count: 0, roles: [] },
    archived_at: null,
    archived_by: null,
    archive_category: null,
    ...overrides,
  };
}

const session = {
  authenticated: true as const,
  email: "creator@example.com",
  csrf_token: "csrf",
};

function mount(item: CreatorRunListItem) {
  apiMocks.getMyRuns.mockImplementation(
    async (_limit: number, _offset: number, archived: boolean) => ({
      runs: archived ? [] : [item],
      limit: 50,
      offset: 0,
      next_offset: null,
    }),
  );
  return render(<MyResearch session={session} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  localeMock.current = "ko";
});

describe("run card labels", () => {
  it("does not print the status twice when the Backend reports it as the stage", async () => {
    // visible_stage() falls back to the lowercased status while a run has no
    // events, which previously rendered a raw untranslated "Queued" beside the
    // localised "대기 중".
    mount(run({ status: "QUEUED", current_stage: "queued" }));

    expect(await screen.findByText("대기 중")).toBeInTheDocument();
    expect(screen.queryByText("Queued")).not.toBeInTheDocument();
    expect(screen.queryByText("queued")).not.toBeInTheDocument();
  });

  it("shows a real stage once the run reports one", async () => {
    mount(run({ status: "RUNNING", current_stage: "blind_multi_lens_ideation" }));

    expect(await screen.findByText("실행 중")).toBeInTheDocument();
    expect(screen.getByText("다중 렌즈 발상")).toBeInTheDocument();
  });

  it("never renders a raw stage identifier it does not recognise", async () => {
    mount(run({ status: "RUNNING", current_stage: "some_unmapped_future_stage" }));

    expect(await screen.findByText("실행 중")).toBeInTheDocument();
    expect(screen.queryByText(/some.unmapped.future.stage/)).not.toBeInTheDocument();
  });

  it("localises the creativity profile", async () => {
    mount(run({ creativity_profile: "BREAKTHROUGH_DISCOVERY" }));

    expect(await screen.findByText("돌파구 탐색")).toBeInTheDocument();
    expect(screen.queryByText("Breakthrough Discovery")).not.toBeInTheDocument();
  });

  it("keeps English labels in English", async () => {
    localeMock.current = "en";
    mount(run({ status: "RUNNING", current_stage: "report_generation" }));

    expect(await screen.findByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Generating reports")).toBeInTheDocument();
    expect(screen.getByText("Breakthrough Discovery")).toBeInTheDocument();
  });
});
