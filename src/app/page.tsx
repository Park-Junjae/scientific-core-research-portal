import { RunsExplorer } from "@/components/runs-explorer";
import { getRuns } from "@/lib/content";

export default function HomePage() {
  return <RunsExplorer runs={getRuns()} home />;
}
