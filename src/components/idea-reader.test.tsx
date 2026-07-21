import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PreferencesProvider } from "@/lib/preferences";
import type { ResearchIdeaManifest } from "@/lib/types";
import { IdeaReader } from "./idea-reader";

const idea: ResearchIdeaManifest = {
  schema_version: "ResearchIdeaManifestV1",
  idea_id: "i",
  slug: "i",
  title: "Test idea",
  short_title: "Test",
  abstract: "A long enough abstract for the reader component to explain a mechanism.",
  category: "Mechanism",
  disposition: "Retained",
  recommendation: "Recommended for focused testing",
  tags: [],
  origin: "demo",
  updated_at: "2026-01-01T00:00:00Z",
  language_variants: { en: "English", ko: "한국어" },
  report_pdf: { en: "/en.pdf", ko: "/ko.pdf" },
  report_markdown: { en: "en.md", ko: "ko.md" },
  knowledge_refs: [],
  reference_count: 1,
  figure_count: 0,
  publication_status: "DEMO_ONLY",
};

describe("IdeaReader", () => {
  it("selects the Korean approved variant", async () => {
    const user = userEvent.setup();
    render(<PreferencesProvider><IdeaReader idea={idea} markdownByLanguage={{ en: "# English report", ko: "# 한국어 보고서" }} /></PreferencesProvider>);
    await user.selectOptions(screen.getByRole("combobox"), "ko");
    expect(screen.getByRole("heading", { name: "한국어 보고서" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download/ })).toHaveAttribute("href", "/ko.pdf");
    await user.click(screen.getByRole("button", { name: /Open PDF/ }));
    expect(screen.getByRole("tab", { name: "PDF" })).toHaveAttribute("data-state", "active");
  });
});
