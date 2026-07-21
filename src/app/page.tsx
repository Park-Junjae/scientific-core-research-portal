import { RunsExplorer } from "@/components/runs-explorer";
import { getRuns, getSearchRecords } from "@/lib/content";

export default function HomePage() {
  return <RunsExplorer runs={getRuns()} searchRecords={getSearchRecords()} heading="Research runs" />;
}
