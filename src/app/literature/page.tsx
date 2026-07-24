import type { Metadata } from "next";
import { GlobalLiterature } from "@/components/global-library";
import { getRuns } from "@/lib/content";

export const metadata: Metadata = { title: "Literature" };

export default function LiteraturePage() {
  return <GlobalLiterature runs={getRuns()} />;
}
