import type { Metadata } from "next";
import { RunsExplorer } from "@/components/runs-explorer";
import { getRuns } from "@/lib/content";

export const metadata: Metadata = { title: "Research runs" };

export default function RunsPage() {
  return <RunsExplorer runs={getRuns()} />;
}
