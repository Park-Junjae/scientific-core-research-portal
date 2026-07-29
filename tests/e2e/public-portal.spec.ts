import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const demoRun = "/runs/xrrna-prime-assembly-demo";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("home is Korean-first and contains the real research composer", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("textbox", { name: "Research goal" })).toBeVisible();
  await expect(page.getByText("모든 연구 질문과 결과는 계정별 비공개로 처리됩니다.")).toBeVisible();
  await expect(page.getByText("AI Cho-Scientist · Private research workspace")).toHaveCount(0);
  await expect(page.getByRole("radio", { name: /STANDARD/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /BREAKTHROUGH DISCOVERY/ })).toBeVisible();
  await expect(page.locator(".run-table")).toHaveCount(0);
});

test("composer call to action keeps a legible label", async ({ page }) => {
  await page.goto("/?lang=ko");
  const cta = page.locator(".review-plan-button");
  await expect(cta).toBeVisible();
  const contrast = await cta.evaluate((node) => {
    const parse = (value: string) => value.match(/\d+/g)!.slice(0, 3).map(Number);
    const luminance = (rgb: number[]) => {
      const channels = rgb.map((value) => {
        const normalized = value / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const style = getComputedStyle(node);
    const foreground = luminance(parse(style.color));
    const background = luminance(parse(style.backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
});

test("desktop and mobile navigation expose the scientific workspace", async ({ page }) => {
  await page.goto("/?lang=ko");
  const desktop = page.locator(".desktop-sidebar");
  for (const name of ["새 연구", "연구 목록", "문헌", "보고서"]) {
    await expect(desktop.getByRole("link", { name })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "탐색 열기" }).click();
  const drawer = page.getByRole("dialog", { name: "탐색" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "문헌" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "보고서" })).toBeVisible();
});

test("Runs remains a compact list with one literature column", async ({ page }) => {
  await page.goto("/runs/?lang=en");
  await expect(page.getByRole("heading", { name: "Research runs" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Literature evidence" })).toBeVisible();
  await expect(page.locator(".run-literature-counts").first()).toContainText("analyzed");
  await expect(page.locator(".run-literature-counts").first()).toContainText("cited");
  await expect(page.locator(".run-literature-counts").first()).toContainText("load-bearing");
  await expect(page.locator(".run-table")).toBeVisible();
  await expect(page.locator(".run-grid")).toHaveCount(0);
  await expect(page.getByText(/report refs|deep-read|full-text/i)).toHaveCount(0);
});

test("Runs search covers public demo title and DOI", async ({ page }) => {
  await page.goto("/runs/?lang=en");
  const search = page.getByPlaceholder("Search titles, questions, ideas, papers, or DOI");
  await search.fill("xrRNA-guided Prime Assembly");
  await expect(page.getByRole("link", { name: "xrRNA-guided Prime Assembly" })).toBeVisible();
  await search.fill("10.1038/s41586-019-1711-4");
  await expect(page.getByRole("link", { name: "xrRNA-guided Prime Assembly" })).toBeVisible();
});

test("run root hides Reports when no approved report artifact exists", async ({ page }) => {
  await page.goto(`${demoRun}/?lang=en`);
  await expect(page.getByText("Research question", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".run-tabs > a")).toHaveCount(5);
  await expect(page.locator(".run-tabs").getByRole("link", { name: "Reports", exact: true })).toHaveCount(0);
  await expect(page.getByText("Current conclusion", { exact: true })).toBeVisible();
});

test("Ideas remains an editorial research-object list", async ({ page }) => {
  await page.goto(`${demoRun}/ideas/?lang=en`);
  await expect(page.locator(".editorial-idea-list")).toBeVisible();
  await expect(page.locator(".idea-card")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Symmetric structured-RNA motif panel/ })).toBeVisible();
});

test("idea detail keeps evaluation secondary", async ({ page }) => {
  await page.goto(`${demoRun}/ideas/assembly-state-gate/?lang=en`);
  const report = page.locator(".idea-main-report");
  const evaluation = page.locator(".evaluation-details");
  await expect(report).toBeVisible();
  await expect(evaluation).not.toHaveAttribute("open", "");
  expect(await report.evaluate((node) => {
    const evaluationNode = document.querySelector(".evaluation-details");
    return evaluationNode ? Boolean(node.compareDocumentPosition(evaluationNode) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
  })).toBeTruthy();
});

test("public Literature exposes a sanitized source detail", async ({ page }) => {
  await page.goto(`${demoRun}/literature/?lang=en`);
  await expect(page.getByRole("heading", { name: "Literature", exact: true })).toBeVisible();
  const completeList = page.locator(".literature-page > section").nth(2);
  await expect(completeList.locator(".source-row")).toHaveCount(1);
  await completeList.getByRole("link", { name: /Search-and-replace genome editing/ }).click();
  await expect(page).toHaveURL(/literature\/demo-anchor-prime-editing/);
  await expect(page.getByText("10.1038/s41586-019-1711-4")).toBeVisible();
});

test("New Research exposes the direct-start workflow", async ({ page }) => {
  await page.goto("/new-run/?lang=en");
  await expect(page.locator("[required]")).toHaveCount(1);
  await expect(page.locator(".advanced-fields")).not.toHaveAttribute("open", "");
  await expect(page.locator("pre, code")).toHaveCount(0);
  const request = page.getByRole("textbox", { name: "Research goal" });
  await request.fill("Why does product purity vary across otherwise similar conditions?");
  await expect(page.getByRole("radio", { name: /standard/i })).toBeChecked();
  await page.getByRole("radio", { name: /Breakthrough Discovery/i }).check();
  await expect(page.getByRole("button", { name: "Start research" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await page.getByText("Options", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Export JSON" })).toBeEnabled();
});

test("mobile primary pages do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/?lang=ko", "/runs/?lang=en", "/literature/?lang=en", "/reports/?lang=en", `${demoRun}/summary/?lang=en`, `${demoRun}/ideas/?lang=en`, `${demoRun}/literature/?lang=en`, `${demoRun}/knowledge/?lang=en`, "/new-run/?lang=en"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBeTruthy();
  }
});

test("primary public reader pages have no serious accessibility violations", async ({ page }) => {
  for (const path of ["/?lang=en", "/runs/?lang=en", `${demoRun}/summary/?lang=en`, `${demoRun}/literature/?lang=en`, `${demoRun}/ideas/assembly-state-gate/?lang=en`, `${demoRun}/knowledge/?lang=en`, "/new-run/?lang=en"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious"), path).toEqual([]);
  }
});

test("global literature preserves provenance and demo summaries are not reports", async ({ page }) => {
  await page.goto("/literature/?lang=en");
  await expect(page.getByRole("heading", { name: "Literature", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Search-and-replace genome editing/ })).toBeVisible();
  await page.goto("/reports/?lang=en");
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read", exact: true })).toHaveCount(0);
});

test("bundled Korean font and heading scale remain stable", async ({ page }) => {
  await page.goto(`${demoRun}/summary/?lang=ko`);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "Pretendard Variable"', "연구 요약 AI Cho-Scientist"))).toBeTruthy();
  expect(await page.locator("h1").first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeLessThanOrEqual(48);
});
