import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/lib/locale";
import { testRun } from "@/test/fixtures";
import { RunMetricStrip } from "./run-metric-strip";
import { RunPortfolioSummary } from "./run-portfolio-summary";

describe("reader summaries", () => {
  it("shows declared literature depth and never a PDF count", () => {
    render(<LocaleProvider><RunMetricStrip stats={testRun.literature_stats} /></LocaleProvider>);
    expect(screen.getByText(/5 papers deeply read/)).toBeInTheDocument();
    expect(screen.queryByText(/PDF reports/i)).not.toBeInTheDocument();
  });
  it("renders research objects as a plain table", () => {
    render(<LocaleProvider><RunPortfolioSummary run={testRun} /></LocaleProvider>);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Test idea")).toBeInTheDocument();
  });
});
