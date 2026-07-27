import type { Metadata } from "next";
import { RunControlPanel } from "@/components/run-control-panel";

export const metadata: Metadata = { title: "Research run control" };

export default function RunControlPage() {
  return (
    <div className="page-container wide-page">
      <RunControlPanel />
    </div>
  );
}
