import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/lib/locale";
import type { IdeaLifecycleStatus } from "@/lib/types";
import { testIdea } from "@/test/fixtures";
import { IdeasPortfolio } from "./ideas-portfolio";

const cases: Array<[IdeaLifecycleStatus, string]> = [["GENERATED", "Generated"], ["DEVELOPED", "Developed"], ["REVIEWED", "Reviewed"], ["FINALIST", "Finalists"], ["CONDITIONAL", "Conditional"], ["MEASUREMENT_PROGRAM", "Measurement"], ["PARKED", "Parked"], ["DROPPED", "Dropped"]];
const ideas = cases.map(([status], index) => ({ ...testIdea, idea_id: `idea-${index}`, slug: `idea-${index}`, title: { en: `${status} object`, ko: `${status} 대상` }, lifecycle_status: status, report_id: null }));

describe("IdeasPortfolio", () => {
  it("uses lifecycle filters only for discovery runs", async () => {
    const user = userEvent.setup();
    render(<LocaleProvider><IdeasPortfolio ideas={ideas} runSlug="run" runMode="DISCOVERY_PORTFOLIO_RUN" /></LocaleProvider>);
    await user.click(screen.getByRole("button", { name: "Parked" }));
    expect(screen.getByRole("link", { name: "PARKED object" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("uses an editorial focused layout below eight research objects", () => {
    const { container } = render(<LocaleProvider><IdeasPortfolio ideas={ideas.slice(0, 4)} runSlug="run" runMode="FOCUSED_DECISION_RUN" /></LocaleProvider>);
    expect(container.querySelector(".editorial-idea-list.focused")).toBeInTheDocument();
    expect(container.querySelector("table")).toBeNull();
  });
});
