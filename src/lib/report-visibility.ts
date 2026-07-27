import type { ResearchReportManifestV2 } from "./types";

const supportedPublicArtifact = /\.(?:pdf|md|markdown)(?:[?#].*)?$/i;

export function isVisiblePublicReport(report: ResearchReportManifestV2) {
  return report.report_status === "APPROVED"
    && typeof report.path === "string"
    && report.path.length > 0
    && supportedPublicArtifact.test(report.path);
}

export function visiblePublicReports(reports: ResearchReportManifestV2[]) {
  return reports.filter(isVisiblePublicReport);
}
