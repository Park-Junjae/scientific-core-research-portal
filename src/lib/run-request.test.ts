import { describe, expect, it } from "vitest";
import {
  buildRunRequest,
  defaultRequestedOutputs,
  initialRunRequest,
  normalizeImportedRequest,
} from "./run-request";

describe("RunRequestV2", () => {
  it("exports a simple request without requiring structured fields", () => {
    const request = buildRunRequest(
      { ...initialRunRequest(), raw_research_request: "Map the causal bottleneck." },
      "en",
      "2026-07-22T00:00:00.000Z",
    );

    expect(request.raw_research_request).toBe("Map the causal bottleneck.");
    expect(request.structured_fields).toBeNull();
    expect(request.inferred_defaults.title).toBe("Map the causal bottleneck.");
    expect(request.inferred_defaults.run_type).toBe("AUTO");
    expect(request.inferred_defaults.visibility).toBe("PRIVATE");
    expect(request.requires_director_compilation).toBe(true);
  });

  it("includes literature and PDF outputs by default", () => {
    expect(defaultRequestedOutputs("en")).toContain("Complete literature list and review scope");
    expect(defaultRequestedOutputs("en")).toContain("Final PDF report");
    expect(defaultRequestedOutputs("ko")).toContain("전체 문헌 목록과 검토 범위");
    expect(defaultRequestedOutputs("ko")).toContain("최종 PDF 보고서");
  });

  it("loads a legacy fully structured request", () => {
    const restored = normalizeImportedRequest({
      schema_version: "RunRequestV1",
      title: "Legacy title",
      run_mode: "FOCUSED_DECISION_RUN",
      research_question: "What state controls the outcome?",
      success_criteria: "Separate two mechanisms.",
      failure_criteria: "No interpretable readout.",
      requested_outputs: ["Summary", "Decision memo"],
      preferred_output_language: "Korean",
      visibility: "LAB_INTERNAL",
    }, "en");

    expect(restored.raw_research_request).toBe("What state controls the outcome?");
    expect(restored.title).toBe("Legacy title");
    expect(restored.run_type).toBe("FOCUSED_DECISION_RUN");
    expect(restored.success_criteria).toBe("Separate two mechanisms.");
    expect(restored.failure_criteria).toBe("No interpretable readout.");
    expect(restored.custom_requested_outputs).toBe("Summary\nDecision memo");
    expect(restored.output_language).toBe("ko");
    expect(restored.visibility).toBe("LAB_INTERNAL");
  });

  it("does not expose invalid imported enum values", () => {
    const restored = normalizeImportedRequest({
      schema_version: "RunRequestV2",
      raw_research_request: "Question",
      structured_fields: {
        run_type: "INTERNAL_UNKNOWN_MODE",
        output_language: "xx",
        visibility: "WORLD",
      },
    }, "en");

    expect(restored.run_type).toBe("");
    expect(restored.output_language).toBe("");
    expect(restored.visibility).toBe("PRIVATE");
  });
});
