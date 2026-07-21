import { describe, expect, it } from "vitest";
import { slugify, statusLabels, statusTone } from "./display";

describe("display helpers", () => {
  it("generates stable ASCII slugs", () => {
    expect(slugify("  Active-site / Vector Control  ")).toBe("active-site-vector-control");
  });

  it("maps internal status to reader language", () => {
    expect(statusLabels.REVIEW_REQUIRED).toBe("Review required");
    expect(statusTone("REVIEW_REQUIRED")).toBe("review-required");
  });
});
