"use client";

import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { localized, useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import { isVisiblePublicReport } from "@/lib/report-visibility";
import type { ResearchReportManifestV2 } from "@/lib/types";

export function ReportIndex({
  runSlug,
  reports,
}: {
  runSlug: string;
  reports: ResearchReportManifestV2[];
}) {
  const { locale, t } = useLocale();
  const visible = reports
    .filter((report) => report.language === locale && isVisiblePublicReport(report))
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <section className="secondary-document-page">
      <h1>{t("reportsDownloads")}</h1>
      <p>
        {locale === "ko"
          ? "검토가 완료되고 실제 파일이 확인된 보고서만 표시됩니다."
          : "Only reviewed reports with verified artifacts are shown."}
      </p>
      <div className="document-list">
        {visible.map((report) => {
          const artifactPath = withBasePath(report.path!);
          const isPdf = report.path!.toLowerCase().split(/[?#]/)[0].endsWith(".pdf");
          return (
            <article key={report.report_id}>
              <div>
                <p className="document-role">{report.role.replaceAll("_", " ")}</p>
                <h2>{localized(report.localized_title, locale)}</h2>
                <p>
                  {report.language.toUpperCase()}
                  {report.page_count ? ` · ${report.page_count} ${t("pages")}` : ""}
                  {report.reference_count ? ` · ${report.reference_count} ${t("references")}` : ""}
                </p>
              </div>
              <div className="document-actions">
                <Link href={`/runs/${runSlug}/reports/${report.report_id}/`}>
                  {locale === "ko" ? "보고서 보기" : "Read report"}
                </Link>
                {isPdf && (
                  <a href={artifactPath} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} />
                    {locale === "ko" ? "PDF 열기" : "Open PDF"}
                  </a>
                )}
                <a href={artifactPath} download>
                  <Download size={16} />
                  {isPdf
                    ? locale === "ko" ? "PDF 다운로드" : "Download PDF"
                    : locale === "ko" ? "Markdown 다운로드" : "Download Markdown"}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
