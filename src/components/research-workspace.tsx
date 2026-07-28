"use client";

import { useState } from "react";
import { MyResearch } from "@/components/my-research";
import { ResearchComposer } from "@/components/new-run-builder";
import type { RunControlSession } from "@/lib/run-control-api";

export function ResearchWorkspace() {
  const [session, setSession] = useState<RunControlSession | null>(null);

  return (
    <main className="page-container wide-page research-workspace">
      <h1 className="sr-only">AI Cho-Scientist</h1>
      <ResearchComposer session={session} onConnected={setSession} />
      <MyResearch session={session} />
    </main>
  );
}
