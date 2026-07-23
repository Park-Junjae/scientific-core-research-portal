import { describe, expect, it } from "vitest";
import { formatDate, slugify, statusLabels, statusTone } from "./display";

describe("display helpers", () => {
  it("generates stable ASCII slugs", () => {
    expect(slugify("  Active-site / Vector Control  ")).toBe("active-site-vector-control");
  });

  it("maps internal status to reader language", () => {
    expect(statusLabels.en.REVIEW_REQUIRED).toBe("Review required");
    expect(statusTone("REVIEW_REQUIRED")).toBe("review-required");
  });

  it("formats dates against UTC for stable server and browser output", () => {
    expect(formatDate("2026-07-16T23:30:00Z", "en")).toBe("Jul 16, 2026");
  });
});
