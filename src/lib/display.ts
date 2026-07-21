import type { RunStatus } from "./types";

export const statusLabels: Record<RunStatus, string> = {
  DRAFT: "Draft",
  RUNNING: "Running",
  REVIEW_REQUIRED: "Review required",
  DONE: "Done",
  FAILED: "Failed",
  BLOCKED: "Blocked",
  ARCHIVED: "Archived",
};

export function formatDate(value: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function statusTone(status: RunStatus) {
  return status.toLowerCase().replace("_", "-");
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
