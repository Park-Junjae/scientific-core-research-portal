import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { IdeaLifecycleStatus, ResearchIdeaManifest } from "@/lib/types";
import { IdeasPortfolio } from "./ideas-portfolio";
import { testIdea } from "@/test/fixtures";

const cases: Array<[IdeaLifecycleStatus, string, string]> = [
  ["GENERATED", "Generated object", "Generated"],
  ["DEVELOPED", "Developed object", "Developed"],
  ["REVIEWED", "Reviewed object", "Reviewed"],
  ["ARENA_ELIGIBLE", "Arena object", "Arena"],
  ["FINALIST", "Finalist object", "Finalists"],
  ["CONDITIONAL", "Conditional object", "Conditional"],
  ["MEASUREMENT_PROGRAM", "Measurement object", "Measurement"],
  ["PARKED", "Parked object", "Parked"],
  ["DROPPED", "Dropped object", "Dropped"],
];

const ideas = cases.map(([status, title], index) => ({
  ...testIdea, idea_id: `idea-${index}`, slug: `idea-${index}`, title, lifecycle_status: status,
  featured: status === "FINALIST", report_pdf: undefined, report_markdown: undefined,
  scorecard: status === "GENERATED" ? undefined : testIdea.scorecard,
})) satisfies ResearchIdeaManifest[];

describe("IdeasPortfolio", () => {
  it("applies every lifecycle filter", async () => {
    const user = userEvent.setup();
    render(<IdeasPortfolio ideas={ideas} runSlug="run" />);
    expect(screen.getAllByRole("article")).toHaveLength(ideas.length);
    for (const [, title, filterLabel] of cases) {
      await user.click(screen.getByRole("button", { name: filterLabel }));
      expect(screen.getByRole("link", { name: title })).toBeInTheDocument();
      expect(screen.getAllByRole("article")).toHaveLength(1);
    }
  });
});
