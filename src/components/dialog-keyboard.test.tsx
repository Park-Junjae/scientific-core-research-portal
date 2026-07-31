import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreatorRunListItem } from "@/lib/run-control-api";
import { PreferencesProvider } from "@/lib/preferences";
import { MyResearch } from "./my-research";

const apiMocks = vi.hoisted(() => ({
  getMyRuns: vi.fn(), archiveControlledRun: vi.fn(),
  restoreControlledRun: vi.fn(), deleteControlledRun: vi.fn(),
}));
vi.mock("@/lib/run-control-api", () => ({ ...apiMocks, runControlApiBase: "https://control.example" }));
vi.mock("@/lib/locale", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/paths", () => ({ withBasePath: (v: string) => v }));

const run: CreatorRunListItem = {
  run_id: "run-dialog-001", display_title: "Dialog Run",
  created_at: "2026-07-31T00:00:00Z", updated_at: "2026-07-31T00:00:00Z",
  status: "COMPLETED", current_stage: "completed", progress_percentage: 100,
  creativity_profile: "STANDARD", budget_profile: "standard",
  literature_analyzed_count: 0, cited_source_count: 0,
  literature_counts: { schema_version: "v1", status: "COMPLETE", discovered: 0,
    title_abstract_screened: 0, full_text_reviewed: 0, deeply_read: 0, analyzed_unique_total: 0,
    load_bearing_sources: 0, unique_cited_sources: 0, final_reference_count: 0, report_reference_count: 0 },
  provider_cost_usd: 0, artifact_availability: { available: false, count: 0, roles: [] },
  archived_at: null, archived_by: null, archive_category: null,
};
const session = { authenticated: true as const, email: "c@example.com", csrf_token: "csrf" };

async function openDialog() {
  apiMocks.getMyRuns.mockImplementation(async (_l: number, _o: number, archived: boolean) => ({
    runs: archived ? [] : [run], limit: 50, offset: 0, next_offset: null }));
  const user = userEvent.setup();
  render(<PreferencesProvider><MyResearch session={session} /></PreferencesProvider>);
  await user.click(await screen.findByRole("tab", { name: "Completed" }));
  await screen.findByText("Dialog Run");
  await user.click(screen.getByLabelText("Dialog Run actions"));
  const invoker = screen.getByRole("button", { name: "Delete permanently" });
  await user.click(invoker);
  await screen.findByRole("dialog");
  return { user, invoker };
}

beforeEach(() => { vi.clearAllMocks(); });

describe("permanent-delete dialog keyboard behaviour", () => {
  it("moves focus into the dialog when it opens", async () => {
    await openDialog();
    await waitFor(() =>
      expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true));
  });

  it("closes on Escape", async () => {
    const { user } = await openDialog();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps Tab inside the dialog", async () => {
    const { user } = await openDialog();
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 8; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("returns focus to the control that opened it", async () => {
    // The invoker is the menu item, not the menu's trigger — that is the
    // element that had focus when the dialog opened.
    const { user, invoker } = await openDialog();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(document.activeElement).toBe(invoker));
    expect(document.activeElement).not.toBe(document.body);
  });
});
