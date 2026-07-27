import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/lib/locale";
import type { RunWithIdeas } from "@/lib/types";
import { testRun } from "@/test/fixtures";
import { RunsExplorer, filterAndSortRuns } from "./runs-explorer";

function runWith(overrides: Partial<RunWithIdeas>): RunWithIdeas {
  return { ...testRun, ...overrides };
}

describe("RunsExplorer", () => {
  beforeEach(() => window.history.replaceState({}, "", "/runs/?lang=en"));

  it("searches DOI, author, localized title, and question without indexing counts", () => {
    for (const query of ["10.0000/test", "A Researcher", "Focused run", "What state controls"]) {
      expect(filterAndSortRuns([testRun], query, "ALL", "updated")).toHaveLength(1);
    }
    expect(filterAndSortRuns([testRun], "200", "ALL", "updated")).toHaveLength(0);
  });

  it("shows analyzed, cited, and load-bearing literature counts", async () => {
    const user = userEvent.setup();
    render(<LocaleProvider><RunsExplorer runs={[testRun]} /></LocaleProvider>);
    const row = screen.getByRole("row", { name: /Focused run/ });
    expect(within(row).getByText("200")).toBeInTheDocument();
    expect(within(row).getByText((_, node) => node?.textContent === "1cited")).toBeInTheDocument();
    expect(within(row).getByText("3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("link", { name: "Focused run" })).toBeInTheDocument();
  });

  it("shows an honest empty workspace without search or fake run statistics", () => {
    render(<LocaleProvider><RunsExplorer runs={[]} home /></LocaleProvider>);
    expect(screen.getByRole("heading", { name: "No completed research yet." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start new research" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows an explicit excluded state when literature scope is disabled", () => {
    render(<LocaleProvider><RunsExplorer runs={[runWith({ literature_scope_enabled: false })]} /></LocaleProvider>);
    expect(screen.getByText("Literature excluded")).toBeInTheDocument();
  });

  it("sorts known analyzed counts both ways and keeps null last", () => {
    const alpha = runWith({ run_id: "alpha", title: { en: "Alpha" }, literature_stats: { analyzed_unique_total: 20 } });
    const beta = runWith({ run_id: "beta", title: { en: "Beta" }, literature_stats: { analyzed_unique_total: 20 } });
    const low = runWith({ run_id: "low", title: { en: "Low" }, literature_stats: { analyzed_unique_total: 3 } });
    const unknown = runWith({ run_id: "unknown", title: { en: "Unknown" }, literature_stats: { analyzed_unique_total: null } });
    expect(filterAndSortRuns([unknown, beta, low, alpha], "", "ALL", "literature_desc").map((run) => run.run_id)).toEqual(["alpha", "beta", "low", "unknown"]);
    expect(filterAndSortRuns([unknown, beta, low, alpha], "", "ALL", "literature_asc").map((run) => run.run_id)).toEqual(["low", "alpha", "beta", "unknown"]);
  });
});
