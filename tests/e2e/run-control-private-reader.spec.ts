import { expect, test } from "@playwright/test";

const runId = "run-synthetic-private";

test("authenticated creator sees an artifact-first completed bundle", async ({ page }) => {
  const artifacts = [
    {
      artifact_id: "artifact-pdf",
      run_id: runId,
      role: "pdf_report",
      filename: "final-report.pdf",
      mime_type: "application/pdf",
      size_bytes: 1200,
      sha256: "a".repeat(64),
      status: "AVAILABLE",
      metadata: {
        title: "Synthetic final report",
        language: "en",
        page_count: 12,
        reference_count: 18,
        updated_at: "2026-07-23T00:05:00Z",
      },
    },
    {
      artifact_id: "artifact-markdown",
      run_id: runId,
      role: "summary",
      filename: "final-report.md",
      mime_type: "text/markdown",
      size_bytes: 42,
      sha256: "b".repeat(64),
      status: "AVAILABLE",
    },
    {
      artifact_id: "artifact-bundle",
      run_id: runId,
      role: "complete_bundle",
      filename: "complete-bundle.zip",
      mime_type: "application/zip",
      size_bytes: 2400,
      sha256: "c".repeat(64),
      status: "AVAILABLE",
    },
    {
      artifact_id: "artifact-ledger",
      run_id: runId,
      role: "source_ledger",
      filename: "source-ledger.json",
      mime_type: "application/json",
      size_bytes: 500,
      sha256: "d".repeat(64),
      status: "AVAILABLE",
    },
    {
      artifact_id: "artifact-manifest",
      run_id: runId,
      role: "artifact_manifest",
      filename: "artifact-manifest.json",
      mime_type: "application/json",
      size_bytes: 300,
      sha256: "e".repeat(64),
      status: "AVAILABLE",
    },
  ];

  await page.route("https://control.example/**", async (route) => {
    const url = new URL(route.request().url());
    const json = (value: unknown, status = 200) => route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(value),
      headers: {
        "Access-Control-Allow-Origin": "http://127.0.0.1:4175",
        "Access-Control-Allow-Credentials": "true",
      },
    });
    if (url.pathname === "/api/session") {
      return json({ authenticated: true, email: "approved@example.com", csrf_token: "csrf" });
    }
    if (url.pathname === `/api/runs/${runId}`) {
      return json({
        run_id: runId,
        creator: "approved-user",
        created_at: "2026-07-23T00:00:00Z",
        updated_at: "2026-07-23T00:05:00Z",
        status: "COMPLETED",
        request_sha256: "d".repeat(64),
        budget_profile: "synthetic",
        runtime_ref: "e".repeat(40),
        queue_expires_at: "2026-07-24T00:00:00Z",
        compiled_contract: null,
        result_locator: "private",
        safe_message: "Synthetic private run completed.",
        current_stage: "completed",
        progress_percentage: 100,
        raw_idea_count: 60,
        independent_idea_count: 18,
        family_count: 6,
        developed_proposal_count: 3,
        literature_analyzed_count: 18,
        cited_source_count: 12,
        literature_counts: {
          schema_version: "LiteratureCountReconciliationV1",
          status: "COMPLETE",
          discovered: 30,
          title_abstract_screened: 24,
          full_text_reviewed: 18,
          deeply_read: 12,
          analyzed_unique_total: 18,
          load_bearing_sources: 6,
          unique_cited_sources: 12,
          final_reference_count: 12,
          report_reference_count: 12,
        },
        elapsed_time_seconds: 300,
        provider_cost_usd: 0,
        runner_state: "ONLINE",
        cancellation_state: "NOT_REQUESTED",
        artifact_availability: {
          available: true,
          count: artifacts.length,
          roles: artifacts.map((item) => item.role),
        },
      });
    }
    if (url.pathname === `/api/runs/${runId}/events`) return json({ events: [] });
    if (url.pathname === `/api/runs/${runId}/bundle`) {
      return json({
        manifest: {
          schema_version: "PrivateArtifactManifestV1",
          run_id: runId,
          artifacts,
        },
        manifest_sha256: "f".repeat(64),
        created_at: "2026-07-23T00:05:00Z",
        artifacts,
      });
    }
    if (url.pathname.endsWith("/artifacts/artifact-pdf/download")) {
      return route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: "%PDF-1.4 synthetic",
        headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:4175",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }
    return json({ detail: "not found" }, 404);
  });

  await page.goto(`/run-control/?run_id=${runId}&lang=ko`);
  await expect(page.getByRole("heading", { name: "연구 계획과 실행 상태" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "연구 결과 파일" })).toBeVisible();
  await expect(page.getByText("내 비공개 결과")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Synthetic final report" })).toBeVisible();
  await expect(page.getByRole("button", { name: "PDF 열기" })).toBeVisible();
  await expect(page.getByRole("link", { name: "PDF 다운로드" })).toHaveAttribute("href", /disposition=attachment/);
  await expect(page.getByRole("link", { name: /Markdown 다운로드/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /ZIP 다운로드/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /문헌 원장/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /산출물 목록/ })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("API key");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
