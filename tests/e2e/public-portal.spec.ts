import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const demoRun = "/runs/xrrna-prime-assembly-demo";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("home is Korean-first and links to the research entry point", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("heading", { name: "새 연구", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /요청서 작성/ })).toHaveAttribute("href", "/new-run/");
});

test("composer call to action keeps a legible label", async ({ page }) => {
  await page.goto("/?lang=ko");
  const cta = page.locator(".composer-cta");
  await expect(cta).toBeVisible();
  expect(await cta.evaluate((node) => getComputedStyle(node).color)).toBe("rgb(255, 255, 255)");
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
  await expect(page.getByRole("columnheader", { name: "Literature analyzed" })).toBeVisible();
  await expect(page.locator(".run-table")).toBeVisible();
  await expect(page.locator(".run-grid")).toHaveCount(0);
  await expect(page.getByText(/report refs|deep-read|full-text/i)).toHaveCount(0);
});

test("Runs search covers public demo title and DOI", async ({ page }) => {
  await page.goto("/runs/?lang=en");
  const search = page.getByPlaceholder("Search titles, questions, ideas, authors, papers, or DOI");
  await search.fill("xrRNA-guided Prime Assembly");
  await expect(page.getByRole("link", { name: "xrRNA-guided Prime Assembly" })).toBeVisible();
  await search.fill("10.1038/s41586-019-1711-4");
  await expect(page.getByRole("link", { name: "xrRNA-guided Prime Assembly" })).toBeVisible();
});

test("run root opens Overview and keeps six scientific tabs", async ({ page }) => {
  await page.goto(`${demoRun}/?lang=en`);
  await expect(page.getByText("Research question", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".run-tabs > a")).toHaveCount(6);
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

test("New Run remains a simple one-field intake", async ({ page }) => {
  await page.goto("/new-run/?lang=en");
  await expect(page.locator("[required]")).toHaveCount(1);
  await expect(page.locator(".advanced-fields")).not.toHaveAttribute("open", "");
  await expect(page.locator("pre, code")).toHaveCount(0);
  const request = page.getByRole("textbox", { name: /What would you like to research/ });
  await request.fill("Why does product purity vary across otherwise similar conditions?");
  await expect(page.getByRole("button", { name: "Save request file" })).toBeEnabled();
});

test("mobile primary pages do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/?lang=ko", "/runs/?lang=en", "/literature/?lang=en", "/reports/?lang=en", `${demoRun}/summary/?lang=en`, `${demoRun}/ideas/?lang=en`, `${demoRun}/literature/?lang=en`, `${demoRun}/knowledge/?lang=en`, "/new-run/?lang=en"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBeTruthy();
  }
});

test("primary public reader pages have no serious accessibility violations", async ({ page }) => {
  for (const path of ["/runs/?lang=en", `${demoRun}/summary/?lang=en`, `${demoRun}/literature/?lang=en`, `${demoRun}/ideas/assembly-state-gate/?lang=en`, `${demoRun}/knowledge/?lang=en`, "/new-run/?lang=en"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious"), path).toEqual([]);
  }
});

test("global literature and reports routes preserve research provenance", async ({ page }) => {
  await page.goto("/literature/?lang=en");
  await expect(page.getByRole("heading", { name: "Literature", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Search-and-replace genome editing/ })).toBeVisible();
  await page.goto("/reports/?lang=en");
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read", exact: true }).first()).toBeVisible();
});

test("bundled Korean font and heading scale remain stable", async ({ page }) => {
  await page.goto(`${demoRun}/summary/?lang=ko`);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "Pretendard Variable"', "연구 요약 AI Cho-Scientist"))).toBeTruthy();
  expect(await page.locator("h1").first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeLessThanOrEqual(48);
});
