import { describe, expect, it } from "vitest";
import {
  COMPACT_RESEARCH_TITLE_LIMIT,
  compactResearchTitle,
} from "./research-title";

describe("compactResearchTitle", () => {
  it("uses the first meaningful sentence and removes list prefixes", () => {
    expect(compactResearchTitle(
      "\n## 1) Research goal: RNA-mediated mitochondrial DNA/RNA base editing.\n- details",
    )).toBe("RNA-mediated mitochondrial DNA/RNA base editing.");
  });

  it("normalizes whitespace and strictly truncates long Korean text", () => {
    expect(compactResearchTitle("첫   연구   문장.\n후속 내용")).toBe("첫 연구 문장.");
    const title = compactResearchTitle("가".repeat(400));
    expect(Array.from(title)).toHaveLength(COMPACT_RESEARCH_TITLE_LIMIT);
    expect(title.endsWith("…")).toBe(true);
  });

  it("adds no ellipsis when the title fits", () => {
    expect(compactResearchTitle("Compact scientific goal")).toBe(
      "Compact scientific goal",
    );
  });
});
