"use client";

import { statusLabels, statusTone } from "@/lib/display";
import { useLocale } from "@/lib/locale";
import type { RunStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: RunStatus }) {
  const { locale } = useLocale();
  return <span className="status-text"><span className={`status-dot ${statusTone(status)}`} aria-hidden="true" />{statusLabels[locale][status]}</span>;
}
