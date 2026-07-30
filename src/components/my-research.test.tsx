import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RunControlApiError,
  type CreatorRunListItem,
} from "@/lib/run-control-api";
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
  RunControlApiError: class extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly kind = "HTTP",
      readonly retryAfterMs = 0,
    ) {
      super(message);
    }
  },
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
  recent_authentication: true,
};

describe("My Research lifecycle controls", () => {
  let activeRuns: CreatorRunListItem[];
  let archivedRuns: CreatorRunListItem[];

  beforeEach(() => {
    vi.clearAllMocks();
    activeRuns = [run({ status: "STARTING", current_stage: "starting" })];
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
    activeRuns = [run()];
    apiMocks.deleteControlledRun.mockImplementation(async (runId: string) => {
      activeRuns = activeRuns.filter((candidate) => candidate.run_id !== runId);
      return { status: "DELETED", run_id: runId };
    });

    render(<MyResearch session={session} />);
    await user.click(screen.getByRole("tab", { name: "Completed" }));
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
      "portal-delete:run-lifecycle-001",
      "creator_requested_cleanup",
    );
  });

  it("resumes a pending deletion after component remount with the same Run key", async () => {
    const user = userEvent.setup();
    activeRuns = [run()];
    apiMocks.deleteControlledRun
      .mockResolvedValueOnce({
        status: "PENDING_OBJECT_DELETE",
        run_id: "run-lifecycle-001",
      })
      .mockImplementationOnce(async (runId: string) => {
        activeRuns = activeRuns.filter((candidate) => candidate.run_id !== runId);
        return { status: "DELETED", run_id: runId };
      });

    const firstMount = render(<MyResearch session={session} />);
    await user.click(screen.getByRole("tab", { name: "Completed" }));
    expect(await screen.findByText("Lifecycle Run")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Lifecycle Run actions"));
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));
    await user.type(screen.getByLabelText(/Type DELETE/), "DELETE");
    await user.click(within(screen.getByRole("dialog")).getByRole(
      "button",
      { name: "Delete permanently" },
    ));
    expect(await screen.findByText(/still being verified/)).toBeInTheDocument();
    firstMount.unmount();

    render(<MyResearch session={session} />);
    await user.click(screen.getByRole("tab", { name: "Completed" }));
    expect(await screen.findByText("Lifecycle Run")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Lifecycle Run actions"));
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));
    await user.type(screen.getByLabelText(/Type DELETE/), "DELETE");
    await user.click(within(screen.getByRole("dialog")).getByRole(
      "button",
      { name: "Delete permanently" },
    ));

    await waitFor(() => expect(screen.queryByText("Lifecycle Run")).not.toBeInTheDocument());
    expect(apiMocks.deleteControlledRun).toHaveBeenCalledTimes(2);
    expect(apiMocks.deleteControlledRun.mock.calls[0][2]).toBe(
      "portal-delete:run-lifecycle-001",
    );
    expect(apiMocks.deleteControlledRun.mock.calls[1][2]).toBe(
      "portal-delete:run-lifecycle-001",
    );
  });

  it("classifies active, finished, and archived lifecycle states exactly", async () => {
    const user = userEvent.setup();
    activeRuns = [
      run({ run_id: "run-starting", display_title: "Starting Run", status: "STARTING" }),
      run({ run_id: "run-queued", display_title: "Queued Run", status: "QUEUED" }),
      run({ run_id: "run-running", display_title: "Running Run", status: "RUNNING" }),
      run({
        run_id: "run-reporting",
        display_title: "Reporting Run",
        status: "GENERATING_REPORTS",
      }),
      run({ run_id: "run-completed", display_title: "Completed Run", status: "COMPLETED" }),
      run({ run_id: "run-failed", display_title: "Failed Run", status: "FAILED" }),
      run({ run_id: "run-cancelled", display_title: "Cancelled Run", status: "CANCELLED" }),
    ];
    archivedRuns = [
      run({
        run_id: "run-disabled",
        display_title: "Disabled Validation",
        status: "EXECUTION_DISABLED",
        archive_category: "system_validation",
      }),
      run({
        run_id: "run-legacy",
        display_title: "Legacy Validation",
        status: "CANCELLED",
        archive_category: "system_validation",
      }),
      run({
        run_id: "run-creator-archive",
        display_title: "Creator Archive",
        archived_at: "2026-07-30T01:00:00Z",
        archived_by: session.email,
        archive_category: "creator_archived",
      }),
    ];

    render(<MyResearch session={session} />);
    expect(await screen.findByText("Starting Run")).toBeInTheDocument();
    expect(screen.getByText("Queued Run")).toBeInTheDocument();
    expect(screen.getByText("Running Run")).toBeInTheDocument();
    expect(screen.getByText("Reporting Run")).toBeInTheDocument();
    expect(screen.queryByText("Completed Run")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed Run")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Completed" }));
    expect(screen.getByText("Completed Run")).toBeInTheDocument();
    expect(screen.getByText("Failed Run")).toBeInTheDocument();
    expect(screen.getByText("Cancelled Run")).toBeInTheDocument();
    expect(screen.queryByText("Starting Run")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Archived" }));
    expect(await screen.findByText("Disabled Validation")).toBeInTheDocument();
    expect(screen.getByText("Legacy Validation")).toBeInTheDocument();
    expect(screen.getByText("Creator Archive")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Restore" })).toHaveLength(1);
  });

  it("preserves deletion intent while requiring a fresh authenticated session", async () => {
    activeRuns = [run()];
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const staleSession = { ...session, recent_authentication: false };
    apiMocks.deleteControlledRun
      .mockRejectedValueOnce(new RunControlApiError(
        "Recent authentication required",
        401,
        "BACKEND_UNAUTHENTICATED",
      ))
      .mockImplementationOnce(async (runId: string) => {
        activeRuns = activeRuns.filter((candidate) => candidate.run_id !== runId);
        return { status: "DELETED", run_id: runId };
      });

    const view = render(<MyResearch session={staleSession} />);
    await user.click(screen.getByRole("tab", { name: "Completed" }));
    expect(await screen.findByText("Lifecycle Run")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Lifecycle Run actions"));
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));
    const confirmation = screen.getByLabelText(/Type DELETE/);
    await user.type(confirmation, "DELETE");
    await user.click(within(screen.getByRole("dialog")).getByRole(
      "button",
      { name: "Delete permanently" },
    ));

    const reauthenticate = await screen.findByRole(
      "button",
      { name: "Reauthenticate with Google" },
    );
    expect(confirmation).toHaveValue("DELETE");
    expect(screen.getByText("run-lifecycle-001")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByRole(
      "button",
      { name: "Delete permanently" },
    )).toBeDisabled();
    await user.click(reauthenticate);
    expect(openSpy).toHaveBeenCalledWith(
      "https://control.example/api/session",
      "_blank",
      "noopener,noreferrer",
    );

    view.rerender(<MyResearch session={{
      ...session,
      csrf_token: "fresh-csrf",
      recent_authentication: true,
    }} />);
    expect(await screen.findByText(/Recent authentication confirmed/)).toBeInTheDocument();
    const retry = within(screen.getByRole("dialog")).getByRole(
      "button",
      { name: "Delete permanently" },
    );
    expect(retry).toBeEnabled();
    await user.click(retry);

    await waitFor(() => expect(screen.queryByText("Lifecycle Run")).not.toBeInTheDocument());
    expect(apiMocks.deleteControlledRun).toHaveBeenLastCalledWith(
      "run-lifecycle-001",
      "fresh-csrf",
      "portal-delete:run-lifecycle-001",
      "creator_requested_cleanup",
    );
    openSpy.mockRestore();
  });
});
