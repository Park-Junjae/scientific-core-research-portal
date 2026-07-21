import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const screenshotRoot = join(process.cwd(), "test-results", "screenshots");

test.beforeAll(() => mkdirSync(screenshotRoot, { recursive: true }));

test("runs search, filter, sorting, list/grid and navigation", async ({ page }) => {
  await page.goto("/runs/");
  await expect(page.getByRole("heading", { name: "Research runs" })).toBeVisible();
  await page.getByPlaceholder("Search runs, ideas, domains, or tags").fill("PRAME");
  await expect(page.locator(".run-table").getByText("PRAME Logic-First Transfer", { exact: true })).toBeVisible();
  await expect(page.getByText("xrRNA-guided Prime Assembly")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Runs", exact: true })).toBeVisible();
  await page.getByPlaceholder("Search runs, ideas, domains, or tags").fill("");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("xrRNA-guided Prime Assembly")).toBeVisible();
  await page.getByRole("button", { name: "All" }).click();
  await page.getByLabel("Sort runs").selectOption("title");
  const actions = page.locator('summary[aria-label="Actions for PRAME Logic-First Transfer"]');
  await actions.click();
  await expect(page.getByRole("link", { name: "Reports" }).last()).toBeVisible();
  await actions.click();
  await page.screenshot({ path: join(screenshotRoot, "runs-list-1440x900.png"), fullPage: true });
  await page.getByRole("button", { name: "Grid view" }).click();
  await expect(page.locator(".run-grid")).toBeVisible();
  await page.screenshot({ path: join(screenshotRoot, "runs-grid-1440x900.png"), fullPage: true });
  await page.getByRole("link", { name: "xrRNA-guided Prime Assembly" }).click();
  await expect(page.getByRole("heading", { name: "xrRNA-guided Prime Assembly" })).toBeVisible();
});

test("run, idea, knowledge and PDF paths are readable", async ({ page, request }) => {
  await page.goto("/runs/xrrna-prime-assembly-demo/");
  await page.screenshot({ path: join(screenshotRoot, "run-overview-1440x900.png"), fullPage: true });
  await page.getByRole("link", { name: "Ideas", exact: true }).click();
  await page.getByRole("link", { name: /Assembly-state gating for/ }).click();
  await expect(page).toHaveURL(/assembly-state-gate\/$/);
  await expect(page.getByRole("heading", { name: /Assembly-state gating for/ })).toBeVisible();
  await page.screenshot({ path: join(screenshotRoot, "idea-report-1440x900.png"), fullPage: true });
  await page.getByRole("combobox", { name: "Report language" }).selectOption("ko");
  await expect(page.getByRole("heading", { name: "조립 상태 선택적 보호" })).toBeVisible();
  const pdfHref = await page.getByRole("link", { name: /Download/ }).getAttribute("href");
  expect(pdfHref).toContain("idea-report-ko.pdf");
  const pdfResponse = await request.get(pdfHref!);
  expect(pdfResponse.ok()).toBeTruthy();
  await page.getByRole("button", { name: /Open PDF/ }).click();
  await expect(page.locator(".pdf-viewer")).toBeVisible();
  await expect(page.locator(".page-control")).toContainText("of 1", { timeout: 15_000 });
  await expect(page.locator(".pdf-canvas-wrap canvas")).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => page.locator("canvas").evaluate((canvas) => {
    const context = (canvas as HTMLCanvasElement).getContext("2d");
    if (!context || (canvas as HTMLCanvasElement).width < 400) return 0;
    const data = context.getImageData(0, 0, (canvas as HTMLCanvasElement).width, (canvas as HTMLCanvasElement).height).data;
    let nonWhite = 0;
    for (let index = 0; index < data.length; index += 400) if (data[index] < 245 || data[index + 1] < 245 || data[index + 2] < 245) nonWhite += 1;
    return nonWhite;
  })).toBeGreaterThan(20);
  await page.screenshot({ path: join(screenshotRoot, "pdf-view-1440x900.png"), fullPage: false });
  await page.goto("/runs/xrrna-prime-assembly-demo/knowledge/");
  await expect(page.getByRole("heading", { name: "Knowledge background", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Technical Details" }).click();
  await expect(page).toHaveURL(/xrrna-prime-assembly-demo\/#technical-details$/);
  await expect(page.locator("#technical-details")).toBeVisible();
  await page.goto("/runs/xrrna-prime-assembly-demo/knowledge/");
  await page.getByPlaceholder("Search this report").fill("state");
  await expect(page.getByText(/text matches?/)).toBeVisible();
});

test("new-run creates local downloads without execution claim", async ({ page }) => {
  await page.goto("/new-run/");
  await expect(page.getByText("It does not execute Scientific Core.")).toBeVisible();
  const form = page.locator(".intake-form");
  await form.locator("input").first().fill("Test research request");
  const textareas = form.locator("textarea");
  await textareas.nth(0).fill("What is the mechanism?");
  await textareas.nth(1).fill("Resolve a causal decision.");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("run-request.json");
  await page.screenshot({ path: join(screenshotRoot, "new-run-1440x900.png"), fullPage: true });
});

test("static deep links and custom 404 exist", async ({ page }) => {
  const response = await page.goto("/runs/taled-historical-demo/ideas/helical-phase-coordinate/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Helical phase as a catalytic positioning coordinate" })).toBeVisible();
  await page.goto("/404.html");
  await expect(page.getByRole("heading", { name: "This research page is not available" })).toBeVisible();
});

test("saved settings alter the live workspace", async ({ page }) => {
  await page.goto("/settings/");
  await page.locator(".setting-row").filter({ hasText: "Runs display" }).getByRole("combobox").selectOption("Grid");
  await page.locator(".setting-row").filter({ hasText: "Reading density" }).getByRole("combobox").selectOption("Compact");
  await page.locator(".setting-row").filter({ hasText: "Theme" }).getByRole("combobox").selectOption("Dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await page.goto("/runs/");
  await expect(page.locator(".run-grid")).toBeVisible();
});

test("primary pages have no critical accessibility violations", async ({ page }) => {
  for (const path of ["/runs/", "/runs/xrrna-prime-assembly-demo/", "/new-run/"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => violation.impact === "critical")).toEqual([]);
  }
});

test("reference and mobile visual captures", async ({ page }) => {
  await page.setViewportSize({ width: 1841, height: 821 });
  await page.goto("/runs/");
  await page.screenshot({ path: join(screenshotRoot, "runs-list-reference-1841x821.png"), fullPage: false });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: join(screenshotRoot, "runs-list-1280x800.png"), fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/runs/");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: join(screenshotRoot, "runs-mobile-390x844.png"), fullPage: true });
});
