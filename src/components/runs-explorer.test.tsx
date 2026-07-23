import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/lib/locale";
import type { RunWithIdeas } from "@/lib/types";
import { testRun } from "@/test/fixtures";
import { RunsExplorer, filterAndSortRuns } from "./runs-explorer";

function runWith(overrides: Partial<RunWithIdeas>): RunWithIdeas {
  return { ...testRun, ...overrides };
}

describe("RunsExplorer", () => {
  it("searches DOI, author, localized title, and question without indexing the count", () => {
    for (const query of ["10.0000/test", "A Researcher", "집중 연구", "What state controls"]) {
      expect(filterAndSortRuns([testRun], query, "ALL", "updated")).toHaveLength(1);
    }
    expect(filterAndSortRuns([testRun], "200", "ALL", "updated")).toHaveLength(0);
  });

  it("renders the canonical heading and an integer-only cell", async () => {
    const user = userEvent.setup();
    render(<LocaleProvider><RunsExplorer runs={[testRun]} /></LocaleProvider>);
    expect(screen.getByRole("columnheader", { name: "Literature analyzed" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "200" })).toHaveTextContent(/^200$/);
    expect(screen.queryByText("200 papers", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("200 cited", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("200 report references", { exact: true })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("link", { name: "Focused run" })).toBeInTheDocument();
  });

  it("shows an em dash and never falls back to cited, report, or load-bearing counts", () => {
    const fallbackRun = runWith({
      run_id: "fallback",
      literature_stats: {
        analyzed_unique_total: null,
        unique_cited_sources: 13,
        report_reference_count: 22,
        load_bearing_sources: 6,
      },
    });
    render(<LocaleProvider><RunsExplorer runs={[fallbackRun]} /></LocaleProvider>);
    const row = screen.getByRole("row", { name: /Focused run/ });
    expect(within(row).getByRole("cell", { name: "—" })).toBeInTheDocument();
    expect(within(row).queryByText(/13 cited|22 report|6 load-bearing/i)).not.toBeInTheDocument();
  });

  it("renders the Korean and English mobile metadata contracts", async () => {
    window.history.replaceState({}, "", "/runs/?lang=ko");
    const { unmount } = render(<LocaleProvider><RunsExplorer runs={[testRun]} /></LocaleProvider>);
    await waitFor(() => expect(screen.getByText("완료 · 아이디어 1 · 분석 문헌 200")).toBeInTheDocument());
    expect(screen.getByRole("columnheader", { name: "분석 문헌" })).toBeInTheDocument();
    unmount();

    window.history.replaceState({}, "", "/runs/?lang=en");
    render(<LocaleProvider><RunsExplorer runs={[testRun]} /></LocaleProvider>);
    await waitFor(() => expect(screen.getByText("Done · 1 idea · 200 papers analyzed")).toBeInTheDocument());
  });

  it("sorts known analyzed counts both ways, keeps null last, and uses title as a stable tie-break", () => {
    const alpha = runWith({ run_id: "alpha", title: { en: "Alpha" }, literature_stats: { analyzed_unique_total: 20 } });
    const beta = runWith({ run_id: "beta", title: { en: "Beta" }, literature_stats: { analyzed_unique_total: 20 } });
    const low = runWith({ run_id: "low", title: { en: "Low" }, literature_stats: { analyzed_unique_total: 3 } });
    const unknown = runWith({ run_id: "unknown", title: { en: "Unknown" }, literature_stats: { analyzed_unique_total: null, unique_cited_sources: 999 } });
    expect(filterAndSortRuns([unknown, beta, low, alpha], "", "ALL", "literature_desc").map((run) => run.run_id)).toEqual(["alpha", "beta", "low", "unknown"]);
    expect(filterAndSortRuns([unknown, beta, low, alpha], "", "ALL", "literature_asc").map((run) => run.run_id)).toEqual(["low", "alpha", "beta", "unknown"]);
  });
});
