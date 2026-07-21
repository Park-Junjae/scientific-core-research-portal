import { statusLabels, statusTone } from "@/lib/display";
import type { RunStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: RunStatus }) {
  return <span className={`status-badge ${statusTone(status)}`}>{statusLabels[status]}</span>;
}
