import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/lib/locale";
import { testIdea, testReports, testSources } from "@/test/fixtures";
import { IdeaReader } from "./idea-reader";

describe("IdeaReader", () => {
  it("places the selected report before collapsed reviewer details", () => {
    render(<LocaleProvider><IdeaReader idea={testIdea} runSlug="r" reports={testReports} sources={testSources} /></LocaleProvider>);
    const report = screen.getByRole("heading", { name: "Complete idea report", level: 3 });
    const details = screen.getByText("Detailed evaluation");
    const keyLiterature = screen.getByRole("heading", { name: "Key papers" });
    const comparison = screen.getByRole("heading", { name: "Proposed comparison" });
    expect(report.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(keyLiterature.compareDocumentPosition(comparison) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(details.closest("details")).not.toHaveAttribute("open");
    expect(screen.queryByText("Stop condition")).not.toBeVisible();
  });

  it("keeps a summary-only idea free of a fabricated PDF", () => {
    render(<LocaleProvider><IdeaReader idea={{ ...testIdea, report_id: null }} runSlug="r" reports={testReports} sources={testSources} /></LocaleProvider>);
    expect(screen.getByText("Approved scientific summary")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open PDF" })).not.toBeInTheDocument();
  });
});
