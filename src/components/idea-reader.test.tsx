import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PreferencesProvider } from "@/lib/preferences";
import { testIdea } from "@/test/fixtures";
import { IdeaReader } from "./idea-reader";

describe("IdeaReader", () => {
  it("selects an approved language and opens the inline PDF", async () => {
    const user = userEvent.setup();
    render(<PreferencesProvider><IdeaReader idea={testIdea} markdownByLanguage={{ en: "# English report", ko: "# Korean report" }} /></PreferencesProvider>);
    await user.selectOptions(screen.getByRole("combobox"), "ko");
    expect(screen.getByRole("heading", { name: "Korean report" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download/ })).toHaveAttribute("href", "/ko.pdf");
    await user.click(screen.getByRole("button", { name: /Open PDF/ }));
    expect(screen.getByRole("tab", { name: "PDF" })).toHaveAttribute("data-state", "active");
  });

  it("keeps an idea without a PDF as a complete summary page", () => {
    const summaryOnly = { ...testIdea, idea_id: "summary", slug: "summary", featured: false, report_pdf: undefined, report_markdown: undefined };
    render(<PreferencesProvider><IdeaReader idea={summaryOnly} markdownByLanguage={{}} /></PreferencesProvider>);
    expect(screen.getByRole("heading", { name: "Scientific summary" })).toBeInTheDocument();
    expect(screen.getByText("Summary-only idea record")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open PDF/ })).not.toBeInTheDocument();
  });
});
