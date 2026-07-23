import type { Locale, RunStatus } from "./types";

export const statusLabels: Record<Locale, Record<RunStatus, string>> = {
  en: { DRAFT: "Draft", RUNNING: "Running", REVIEW_REQUIRED: "Review required", DONE: "Done", FAILED: "Failed", BLOCKED: "Blocked", ARCHIVED: "Archived" },
  ko: { DRAFT: "초안", RUNNING: "진행 중", REVIEW_REQUIRED: "검토 필요", DONE: "완료", FAILED: "실패", BLOCKED: "중단", ARCHIVED: "보관" },
};

export function formatDate(value: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric", month: locale === "ko" ? "long" : "short", day: "numeric", timeZone: "UTC",
  }).format(new Date(value));
}

export function statusTone(status: RunStatus) { return status.toLowerCase().replaceAll("_", "-"); }

export function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
