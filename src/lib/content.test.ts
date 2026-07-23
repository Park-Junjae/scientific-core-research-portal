import { describe, expect, it } from "vitest";
import { testRun } from "@/test/fixtures";
import { getReport, reportForLocale, validatePrimaryArtifacts } from "./content";

describe("report identity", () => {
  it("resolves the requested report by id regardless of array order", () => {
    const reordered = { ...testRun, reports: [...testRun.reports].reverse() };
    expect(getReport(reordered, "idea-en").role).toBe("IDEA_REPORT");
    expect(reportForLocale(reordered, "idea-en", "ko")?.report_id).toBe("idea-ko");
  });

  it("rejects a missing primary artifact", () => {
    expect(() => validatePrimaryArtifacts({ ...testRun, primary_report_id: "missing" })).toThrow(/does not exist/);
  });
});
