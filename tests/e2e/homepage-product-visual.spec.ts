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
const displayTitle = "Controllable state for product purity and activity";

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
  await expect(composer.getByText("creator@example.com", { exact: true })).toBeVisible();
  await composer.getByRole("textbox", { name: "Research goal" }).fill(question);
  await composer.getByText("Options", { exact: true }).click();
  await composer.getByRole("textbox", { name: "Objectives" }).fill("Identify a discriminating mechanism\nPreserve product activity");
  await composer.getByRole("textbox", { name: "Constraints", exact: true }).fill("Use fixture evidence only");
  if (breakthrough) {
    await composer.getByRole("radio", { name: /breakthrough discovery/i }).check();
  }
  await expect(composer.getByRole("radio", { name: breakthrough ? /breakthrough discovery/i : /standard/i })).toBeChecked();
  return composer;
}

async function openRun(
  page: Page,
  status: "STARTING" | "EXECUTION_DISABLED" | "RUNNING" | "COMPLETED",
) {
  await installPrivateWorkspaceRoutes(page, status);
  await seedSubmittedSummary(page);
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);
  await expect(page.getByRole("heading", { name: displayTitle })).toBeVisible();
}

test("desktop 01 disconnected homepage", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?lang=en");
  await expect(page.getByRole("textbox", { name: "Research goal" })).toBeVisible();
  await capture(page, "desktop-01-disconnected-homepage");
});

test("desktop 02 connected empty My Research", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installPrivateWorkspaceRoutes(page, "STARTING", { list: "empty" });
  await page.goto("/?lang=en");
  const research = page.locator(".my-research-section");
  await expect(research.getByText("No research yet.", { exact: true })).toBeVisible();
  await research.scrollIntoViewIfNeeded();
  await capture(page, "desktop-02-connected-empty");
});

test("desktop 03 Standard filled composer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const composer = await fillComposer(page);
  await composer.locator(".primary-request-field").scrollIntoViewIfNeeded();
  await capture(page, "desktop-03-standard-filled");
});

test("desktop 04 Breakthrough filled composer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const composer = await fillComposer(page, true);
  await composer.locator(".creativity-selector").scrollIntoViewIfNeeded();
  await capture(page, "desktop-04-breakthrough-filled");
});

test("desktop 05 direct research starting", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRun(page, "STARTING");
  const launch = page.locator(".launch-progress");
  await expect(launch.getByRole("heading", { name: "Starting" })).toBeVisible();
  await launch.scrollIntoViewIfNeeded();
  await capture(page, "desktop-05-direct-start");
});

test("desktop 06 execution temporarily disabled", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRun(page, "EXECUTION_DISABLED");
  const launch = page.locator(".execution-disabled-state");
  await expect(
    launch.getByRole("heading", { name: "Execution disabled" }),
  ).toBeVisible();
  await expect(launch.locator(".spin")).toHaveCount(0);
  await launch.scrollIntoViewIfNeeded();
  await capture(page, "desktop-06-execution-disabled");
});

test("desktop 07 running research", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRun(page, "RUNNING");
  const progress = page.locator(".execution-progress");
  await expect(progress.getByRole("heading", { name: "Research progress" })).toBeVisible();
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
  await expect(page.getByRole("textbox", { name: "Research goal" })).toBeVisible();
  await capture(page, "mobile-01-disconnected-homepage");
});

test("mobile 02 Breakthrough selector", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const composer = await fillComposer(page, true);
  await composer.locator(".creativity-selector").scrollIntoViewIfNeeded();
  await capture(page, "mobile-02-breakthrough-selector");
});

test("mobile 03 direct research status", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRun(page, "STARTING");
  const launch = page.locator(".launch-progress");
  await expect(launch).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(
    page.locator(".mobile-header").getByText("AI Cho-Scientist", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(150);
  await capture(page, "mobile-03-direct-start");
});

test("mobile 04 My Research", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installPrivateWorkspaceRoutes(page, "RUNNING", { list: "current" });
  await page.goto("/?lang=en");
  const research = page.locator(".my-research-section");
  await expect(research.getByRole("link", { name: displayTitle })).toBeVisible();
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
