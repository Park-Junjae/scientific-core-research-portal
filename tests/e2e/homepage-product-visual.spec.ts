import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  fixtureRunId,
  installPrivateWorkspaceRoutes,
  seedSubmittedSummary,
} from "./fixtures/private-workspace";

const screenshotRoot = join("UPDATED_SCREENSHOTS", "homepage-first");
const question = "Which controllable state preserves product purity without sacrificing activity?";

mkdirSync(screenshotRoot, { recursive: true });
test.describe.configure({ mode: "serial" });

async function ready(page: Page) {
  await page.evaluate(async () => {
    if ("fonts" in document) await document.fonts.ready;
  });
}

async function capture(page: Page, name: string) {
  await ready(page);
  await page.screenshot({
    path: join(screenshotRoot, `${name}.png`),
    animations: "disabled",
  });
}

async function fillComposer(page: Page, breakthrough = false) {
  await installPrivateWorkspaceRoutes(page);
  await page.goto("/?lang=en");
  const composer = page.locator(".research-composer-shell");
  await composer.getByRole("button", { name: "Check connection" }).click();
  await composer.getByRole("textbox", { name: /Research question/ }).fill(question);
  await composer.getByRole("textbox", { name: /Objectives/ }).fill("Identify a discriminating mechanism\nPreserve product activity");
  await composer.getByRole("textbox", { name: /Experimental constraints/ }).fill("Use fixture evidence only");
  if (breakthrough) {
    await composer.getByRole("radio", { name: /breakthrough discovery/i }).check();
  }
  await expect(composer.getByText(breakthrough ? "Breakthrough Discovery" : "Standard").last()).toBeVisible();
  return composer;
}

async function openRun(page: Page, status: "PREFLIGHT" | "AWAITING_APPROVAL" | "RUNNING" | "COMPLETED") {
  await installPrivateWorkspaceRoutes(page, status);
  await seedSubmittedSummary(page);
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);
  await expect(page.getByRole("heading", { name: "Research plan and execution" })).toBeVisible();
}

test("desktop 01 disconnected homepage", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?lang=en");
  await expect(page.getByRole("heading", { name: "What should we investigate?" })).toBeVisible();
  await capture(page, "desktop-01-disconnected-homepage");
});

test("desktop 02 connected empty My Research", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installPrivateWorkspaceRoutes(page, "AWAITING_APPROVAL", { list: "empty" });
  await page.goto("/?lang=en");
  await page.locator(".research-composer-shell").getByRole("button", { name: "Check connection" }).click();
  const research = page.locator(".my-research-section");
  await expect(research.getByRole("heading", { name: "No research for this account yet." })).toBeVisible();
  await research.scrollIntoViewIfNeeded();
  await capture(page, "desktop-02-connected-empty");
});

test("desktop 03 Standard filled composer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const composer = await fillComposer(page);
  await composer.locator(".selected-profile-summary").scrollIntoViewIfNeeded();
  await capture(page, "desktop-03-standard-filled");
});

test("desktop 04 Breakthrough filled composer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const composer = await fillComposer(page, true);
  await composer.locator(".creativity-selector").scrollIntoViewIfNeeded();
  await capture(page, "desktop-04-breakthrough-filled");
});

test("desktop 05 zero-provider preflight result", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRun(page, "AWAITING_APPROVAL");
  const contract = page.locator(".compiled-contract");
  await expect(contract.getByRole("heading", { name: "Compiled research plan" })).toBeVisible();
  await contract.scrollIntoViewIfNeeded();
  await capture(page, "desktop-05-preflight-result");
});

test("desktop 06 awaiting self-approval", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRun(page, "AWAITING_APPROVAL");
  const approval = page.locator(".approval-panel");
  await expect(approval.getByRole("heading", { name: "Approve my execution" })).toBeVisible();
  await approval.scrollIntoViewIfNeeded();
  await capture(page, "desktop-06-awaiting-approval");
});

test("desktop 07 running research", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRun(page, "RUNNING");
  const progress = page.locator(".execution-progress");
  await expect(progress.getByRole("heading", { name: "Research stage progress" })).toBeVisible();
  await progress.scrollIntoViewIfNeeded();
  await capture(page, "desktop-07-running");
});

test("desktop 08 completed results", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRun(page, "COMPLETED");
  const results = page.locator(".private-result-reader");
  await expect(results.getByRole("heading", { name: "Research result artifacts" })).toBeVisible();
  await results.scrollIntoViewIfNeeded();
  await capture(page, "desktop-08-completed");
});

test("mobile 01 disconnected homepage", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?lang=en");
  await expect(page.getByRole("heading", { name: "What should we investigate?" })).toBeVisible();
  await capture(page, "mobile-01-disconnected-homepage");
});

test("mobile 02 Breakthrough selector", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const composer = await fillComposer(page, true);
  await composer.locator(".creativity-selector").scrollIntoViewIfNeeded();
  await capture(page, "mobile-02-breakthrough-selector");
});

test("mobile 03 self-approval", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRun(page, "AWAITING_APPROVAL");
  const approval = page.locator(".approval-panel");
  await approval.scrollIntoViewIfNeeded();
  await capture(page, "mobile-03-approval");
});

test("mobile 04 My Research", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installPrivateWorkspaceRoutes(page, "RUNNING", { list: "current" });
  await page.goto("/?lang=en");
  await page.locator(".research-composer-shell").getByRole("button", { name: "Check connection" }).click();
  const research = page.locator(".my-research-section");
  await expect(research.getByRole("link", { name: question })).toBeVisible();
  await research.scrollIntoViewIfNeeded();
  await capture(page, "mobile-04-my-research");
});

test("mobile 05 completed results", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRun(page, "COMPLETED");
  const results = page.locator(".private-result-reader");
  await expect(results.getByRole("heading", { name: "Research result artifacts" })).toBeVisible();
  await results.scrollIntoViewIfNeeded();
  await capture(page, "mobile-05-completed");
});
