import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreatorRunListItem } from "@/lib/run-control-api";
import { MyResearch } from "./my-research";

const apiMocks = vi.hoisted(() => ({
  getMyRuns: vi.fn(),
  archiveControlledRun: vi.fn(),
  restoreControlledRun: vi.fn(),
  deleteControlledRun: vi.fn(),
}));

vi.mock("@/lib/run-control-api", () => ({
  ...apiMocks,
  runControlApiBase: "https://control.example",
}));
vi.mock("@/lib/locale", () => ({
  useLocale: () => ({ locale: "en" }),
}));
vi.mock("@/lib/paths", () => ({
  withBasePath: (value: string) => value,
}));

function run(overrides: Partial<CreatorRunListItem> = {}): CreatorRunListItem {
  return {
    run_id: "run-lifecycle-001",
    display_title: "Lifecycle Run",
    created_at: "2026-07-30T00:00:00Z",
    updated_at: "2026-07-30T00:00:00Z",
    status: "FAILED",
    current_stage: "failed",
    progress_percentage: 40,
    creativity_profile: "STANDARD",
    budget_profile: "standard",
    literature_analyzed_count: 3,
    cited_source_count: 2,
    literature_counts: {
      schema_version: "LiteratureCountReconciliationV1",
      status: "COMPLETE",
      discovered: 3,
      title_abstract_screened: 3,
      full_text_reviewed: 3,
      deeply_read: 3,
      analyzed_unique_total: 3,
      load_bearing_sources: 2,
      unique_cited_sources: 2,
      final_reference_count: 2,
      report_reference_count: 2,
    },
    provider_cost_usd: 0,
    artifact_availability: { available: true, count: 1, roles: ["pdf_report"] },
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

describe("My Research lifecycle controls", () => {
  let activeRuns: CreatorRunListItem[];
  let archivedRuns: CreatorRunListItem[];

  beforeEach(() => {
    vi.clearAllMocks();
    activeRuns = [run()];
    archivedRuns = [];
    apiMocks.getMyRuns.mockImplementation(
      async (_limit: number, _offset: number, archived: boolean) => ({
        runs: archived ? [...archivedRuns] : [...activeRuns],
        limit: 50,
        offset: 0,
        next_offset: null,
      }),
    );
  });

  it("archives and restores a card without a manual page refresh", async () => {
    const user = userEvent.setup();
    apiMocks.archiveControlledRun.mockImplementation(async (runId: string) => {
      const item = activeRuns.find((candidate) => candidate.run_id === runId)!;
      activeRuns = activeRuns.filter((candidate) => candidate.run_id !== runId);
      archivedRuns = [{
        ...item,
        archived_at: "2026-07-30T01:00:00Z",
        archived_by: session.email,
        archive_category: "creator_archived",
      }];
      return item;
    });
    apiMocks.restoreControlledRun.mockImplementation(async (runId: string) => {
      const item = archivedRuns.find((candidate) => candidate.run_id === runId)!;
      archivedRuns = archivedRuns.filter((candidate) => candidate.run_id !== runId);
      activeRuns = [{
        ...item,
        archived_at: null,
        archived_by: null,
        archive_category: null,
      }];
      return item;
    });

    render(<MyResearch session={session} />);
    expect(await screen.findByText("Lifecycle Run")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Lifecycle Run actions"));
    await user.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(screen.queryByText("Lifecycle Run")).not.toBeInTheDocument());

    await user.click(screen.getByRole("tab", { name: "Archived" }));
    expect(await screen.findByText("Lifecycle Run")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Lifecycle Run actions"));
    await user.click(screen.getByRole("button", { name: "Restore" }));
    await waitFor(() => expect(screen.queryByText("Lifecycle Run")).not.toBeInTheDocument());

    await user.click(screen.getByRole("tab", { name: "Active" }));
    expect(await screen.findByText("Lifecycle Run")).toBeInTheDocument();
  });

  it("requires explicit confirmation and removes a deleted card immediately", async () => {
    const user = userEvent.setup();
    apiMocks.deleteControlledRun.mockImplementation(async (runId: string) => {
      activeRuns = activeRuns.filter((candidate) => candidate.run_id !== runId);
      return { status: "DELETED", run_id: runId };
    });

    render(<MyResearch session={session} />);
    expect(await screen.findByText("Lifecycle Run")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Lifecycle Run actions"));
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Reports and all private files/)).toBeInTheDocument();
    const confirmButton = within(dialog).getByRole("button", { name: "Delete permanently" });
    expect(confirmButton).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Type DELETE/), "DELETE");
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);

    await waitFor(() => expect(screen.queryByText("Lifecycle Run")).not.toBeInTheDocument());
    expect(apiMocks.deleteControlledRun).toHaveBeenCalledWith(
      "run-lifecycle-001",
      "csrf",
      expect.stringMatching(/^portal-delete:/),
      "creator_requested_cleanup",
    );
  });
});
