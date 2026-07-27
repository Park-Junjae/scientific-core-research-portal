import { describe, expect, it } from "vitest";
import { testReports } from "@/test/fixtures";
import { isVisiblePublicReport, visiblePublicReports } from "./report-visibility";

describe("public report visibility", () => {
  it("does not create a report target for DEMO_SUMMARY or pathless records", () => {
    const demoSummary = testReports.find((report) => report.report_status === "DEMO_SUMMARY")!;
    const pathlessApproved = testReports.find(
      (report) => report.report_status === "APPROVED" && report.path === null,
    )!;
    expect(isVisiblePublicReport(demoSummary)).toBe(false);
    expect(isVisiblePublicReport(pathlessApproved)).toBe(false);
    expect(visiblePublicReports(testReports).map((report) => report.report_id)).toEqual([
      "idea-en",
      "idea-ko",
    ]);
  });
});
