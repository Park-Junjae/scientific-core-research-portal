import { expect, test } from "@playwright/test";

const runId = "run-synthetic-private";
const artifactId = "artifact-summary";

test("authenticated owner reads a completed private bundle", async ({ page }) => {
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
      return json({ authenticated: true, login: "approved-user", csrf_token: "csrf" });
    }
    if (url.pathname === `/api/runs/${runId}`) {
      return json({
        run_id: runId,
        creator: "approved-user",
        created_at: "2026-07-23T00:00:00Z",
        updated_at: "2026-07-23T00:05:00Z",
        status: "COMPLETED",
        request_sha256: "a".repeat(64),
        budget_profile: "synthetic",
        runtime_ref: "d".repeat(40),
        queue_expires_at: "2026-07-24T00:00:00Z",
        compiled_contract: null,
        result_locator: "private",
        safe_message: "Synthetic private run completed.",
      });
    }
    if (url.pathname === `/api/runs/${runId}/events`) {
      return json({ events: [] });
    }
    if (url.pathname === "/api/runners/scientific-core-vm") {
      return json({ runner: "scientific-core-vm", online: true, fallback_runner: null });
    }
    if (url.pathname === `/api/runs/${runId}/bundle`) {
      const artifact = {
        artifact_id: artifactId,
        run_id: runId,
        role: "summary",
        filename: "summary.md",
        mime_type: "text/markdown",
        size_bytes: 42,
        sha256: "b".repeat(64),
        status: "AVAILABLE",
      };
      return json({
        manifest: {
          schema_version: "PrivateArtifactManifestV1",
          run_id: runId,
          artifacts: [artifact],
        },
        manifest_sha256: "c".repeat(64),
        created_at: "2026-07-23T00:05:00Z",
        artifacts: [artifact],
      });
    }
    if (url.pathname.endsWith(`/artifacts/${artifactId}/download`)) {
      return route.fulfill({
        status: 200,
        contentType: "text/markdown",
        body: "# Synthetic summary\n\nPrivate owner-only delivery works.",
        headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:4175",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }
    return json({ detail: "not found" }, 404);
  });

  await page.goto(`/run-control/?run_id=${runId}&lang=ko`);
  await expect(page.getByRole("heading", { name: "연구 실행 제어" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "비공개 연구 결과" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Synthetic summary" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("API key");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
