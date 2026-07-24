import type { Metadata } from "next";
import { GlobalReports } from "@/components/global-library";
import { getRuns } from "@/lib/content";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <GlobalReports runs={getRuns()} />;
}
