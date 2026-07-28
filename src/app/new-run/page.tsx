import type { Metadata } from "next";
import { ResearchWorkspace } from "@/components/research-workspace";

export const metadata: Metadata = { title: "Research workspace" };
export default function NewRunPage() { return <ResearchWorkspace />; }
