import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/lib/locale";
import { testReports, testRun, testSources } from "@/test/fixtures";
import { KnowledgeReader } from "./knowledge-reader";
import { LiteratureExplorer } from "./literature-explorer";
import { MarkdownArticle } from "./markdown-article";
import { NewRunBuilder } from "./new-run-builder";
import { ReportReader } from "./report-reader";
import { SourceDetail } from "./source-detail";

describe("literature reading UX", () => {
  it("shows declared key papers and a deep-linkable source", () => {
    render(<LocaleProvider><LiteratureExplorer run={testRun} /></LocaleProvider>);
    expect(screen.getByRole("heading", { name: "Key papers" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "A cited paper" })[0]).toHaveAttribute("href", "/runs/r/literature/source-1");
    expect(screen.getAllByRole("link", { name: /DOI/ })[0]).toHaveAttribute("href", "https://doi.org/10.0000/test");
  });

  it("shows run-corpus accounting filters as plain text", () => {
    render(<LocaleProvider><LiteratureExplorer run={testRun} /></LocaleProvider>);
    expect(screen.getByRole("button", { name: "All 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cited in final reports 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load-bearing 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not cited 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post-Atlas addition 0" })).toBeInTheDocument();
  });

  it("retains the complete detailed literature funnel", () => {
    const { container } = render(<LocaleProvider><LiteratureExplorer run={testRun} /></LocaleProvider>);
    const funnel = container.querySelector<HTMLElement>(".literature-funnel-grid")!;
    expect(within(funnel).getByText("Discovered").nextSibling).toHaveTextContent("30");
    expect(within(funnel).getByText("Full text").nextSibling).toHaveTextContent("8");
    expect(within(funnel).getByText("Deeply read").nextSibling).toHaveTextContent("5");
    expect(within(funnel).getByText("Load-bearing").nextSibling).toHaveTextContent("3");
    expect(within(funnel).getByText("Cited in report").nextSibling).toHaveTextContent("1");
    expect(screen.getByText(/Report reference entries/).parentElement).toHaveTextContent("4");
  });

  it("resolves a numbered report citation and restores focus after Escape", async () => {
    render(<LocaleProvider><MarkdownArticle markdown={"## Evidence\n\nMechanism [1]."} runSlug="r" reportId="idea-en" sources={testSources} /></LocaleProvider>);
    const trigger = screen.getByRole("button", { name: "Preview source: 1" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Citation preview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View source" })).toHaveAttribute("href", "/runs/r/literature/source-1");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Citation preview" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Preview source: 1" })).toHaveFocus());
  });

  it("orders source evidence before relationships and access links", () => {
    const { container } = render(<LocaleProvider><SourceDetail run={testRun} source={testSources[0]} /></LocaleProvider>);
    const headings = Array.from(container.querySelectorAll("section > h2")).map((node) => node.textContent);
    expect(headings).toEqual(["Why it matters", "What this source shows", "What it does not show", "Related ideas", "Related reports and sections", "Access and source links"]);
    expect(screen.getByText(/evidence/)).toBeInTheDocument();
  });

  it("provides Read, Key papers, and References views in Knowledge", () => {
    render(<LocaleProvider><KnowledgeReader run={testRun} markdownByReport={{ "knowledge-en": "## Background\n\nText [1]." }} /></LocaleProvider>);
    expect(screen.getByRole("button", { name: "Read" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Key papers" }));
    expect(screen.getByRole("heading", { name: "Key papers" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "references" }));
    expect(screen.getByRole("heading", { name: "references" })).toBeInTheDocument();
  });
});

describe("reader contracts", () => {
  it("renders a report title once and starts with report metadata", () => {
    render(<LocaleProvider><ReportReader runSlug="r" selectedId="idea-en" reports={testReports} sources={testSources} markdownByReport={{ "idea-en": "## Abstract\n\nBody [1]." }} /></LocaleProvider>);
    expect(screen.getAllByRole("heading", { name: "Complete idea report" })).toHaveLength(1);
    expect(screen.getByText(/IDEA REPORT/)).toBeInTheDocument();
  });

  it("starts New Run with one required natural-language field and no empty preview", () => {
    const { container } = render(<LocaleProvider><NewRunBuilder /></LocaleProvider>);
    expect(container.querySelector("pre, code")).toBeNull();
    expect(screen.queryByText(/^# /)).not.toBeInTheDocument();
    expect(screen.queryByText("FOCUSED_DECISION_RUN")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[required]")).toHaveLength(1);
    expect(container.querySelector(".advanced-fields")).not.toHaveAttribute("open");
    expect(screen.queryByRole("heading", { name: "Request preview" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review research plan" })).toBeDisabled();
    expect(screen.getByText("Research execution is being prepared.")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: /Research question/ }), {
      target: { value: "Why does product purity collapse at this locus?" },
    });

    expect(screen.getByRole("button", { name: "Review research plan" })).toBeDisabled();
    expect(screen.getByText("Request preview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Why does product purity collapse at this locus?" })).toBeInTheDocument();
    expect(screen.getByText("Included")).toBeInTheDocument();
  });
});
