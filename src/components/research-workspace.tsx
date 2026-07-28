"use client";

import { CheckCircle2, FlaskConical, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { MyResearch } from "@/components/my-research";
import { ResearchComposer } from "@/components/new-run-builder";
import { useLocale } from "@/lib/locale";
import type { RunControlSession } from "@/lib/run-control-api";

export function ResearchWorkspace() {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const [session, setSession] = useState<RunControlSession | null>(null);

  return (
    <main className="page-container wide-page research-workspace">
      <header className="research-workspace-hero">
        <p className="product-context">AI Cho-Scientist · Private research workspace</p>
        <h1>
          {ko
            ? "연구 질문에서 검증 가능한 연구 실행까지"
            : "From research question to accountable execution"}
        </h1>
        <p>
          {ko
            ? "질문을 작성하고 Standard 또는 Breakthrough Discovery를 선택하세요. 무비용 사전 검토와 직접 승인을 거쳐 같은 비공개 작업공간에서 실행과 결과를 추적합니다."
            : "Write the question and choose Standard or Breakthrough Discovery. Continue through zero-provider preflight, self-approval, execution, and private results in one workspace."}
        </p>
      </header>

      <ResearchComposer session={session} onConnected={setSession} />

      <section
        className={`connected-account-state${session ? " connected" : ""}`}
        aria-label={ko ? "연결된 계정 상태" : "Connected account state"}
      >
        {session ? <CheckCircle2 size={20} /> : <LockKeyhole size={20} />}
        <div>
          <strong>
            {session
              ? (ko ? "랩 계정 연결됨" : "Lab account connected")
              : (ko ? "아직 연결되지 않음" : "Not connected yet")}
          </strong>
          <p>
            {session
              ? `${session.email} · ${ko ? "이 계정의 비공개 연구만 표시됩니다." : "Only this creator's private research is shown."}`
              : (ko
                  ? "질문은 로컬에서 작성할 수 있습니다. 사전 검토를 시작하려면 위에서 계정을 연결하세요."
                  : "You can draft the question locally. Connect above to start private preflight.")}
          </p>
        </div>
      </section>

      <MyResearch session={session} />

      <section className="workspace-explanation" aria-label={ko ? "제품 원칙" : "Product principles"}>
        <div>
          <FlaskConical size={20} />
          <h2>{ko ? "사전 검토가 먼저입니다" : "Preflight comes first"}</h2>
          <p>{ko ? "계획과 예산 상한을 보기 전에는 provider 기반 연구가 시작되지 않습니다." : "Provider-backed work cannot start before the plan and budget ceilings are visible."}</p>
        </div>
        <div>
          <ShieldCheck size={20} />
          <h2>{ko ? "승인은 직접 합니다" : "Approval stays with you"}</h2>
          <p>{ko ? "각 사용자는 자신의 실행만 승인·취소하고 자신의 결과만 내려받습니다." : "Each creator approves or cancels only their own run and downloads only their own results."}</p>
        </div>
      </section>
    </main>
  );
}
