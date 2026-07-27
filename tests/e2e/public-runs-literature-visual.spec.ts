import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const output = join(process.cwd(), ".publication-staging", "public-visual-qa");

test.beforeAll(() => mkdirSync(output, { recursive: true }));

for (const item of [
  { name: "home-ko-desktop", route: "/?lang=ko", viewport: { width: 1440, height: 1000 }, kind: "home" },
  { name: "run-detail-ko-desktop", route: "/runs/xrrna-prime-assembly-demo/summary/?lang=ko", viewport: { width: 1440, height: 1000 }, kind: "run" },
  { name: "home-ko-mobile", route: "/?lang=ko", viewport: { width: 390, height: 844 }, kind: "home" },
  { name: "run-detail-ko-mobile", route: "/runs/xrrna-prime-assembly-demo/summary/?lang=ko", viewport: { width: 390, height: 844 }, kind: "run" },
  { name: "runs-desktop", route: "/runs/?lang=en", viewport: { width: 1440, height: 900 } },
  { name: "runs-mobile", route: "/runs/?lang=en", viewport: { width: 390, height: 844 } },
  { name: "literature-desktop", route: "/runs/xrrna-prime-assembly-demo/literature/?lang=en", viewport: { width: 1440, height: 900 } },
  { name: "literature-mobile", route: "/runs/xrrna-prime-assembly-demo/literature/?lang=en", viewport: { width: 390, height: 844 } },
] as const) {
  test(`public visual check ${item.name}`, async ({ page }) => {
    await page.setViewportSize(item.viewport);
    await page.goto(item.route);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    if ("kind" in item && item.kind === "home") {
      await expect(page.getByRole("heading", { name: "새 연구", exact: true })).toBeVisible();
    } else if ("kind" in item && item.kind === "run") {
      await expect(page.getByText("현재 결론", { exact: true })).toBeVisible();
    } else if (item.route.includes("literature")) {
      await expect(page.getByRole("heading", { name: "Literature", exact: true })).toBeVisible();
      await expect(page.locator(".literature-page > section").nth(2).locator(".source-row")).toHaveCount(1);
    } else {
      await expect(page.getByRole("heading", { name: "Research runs" })).toBeVisible();
    }
    await page.screenshot({ path: join(output, `${item.name}.png`), fullPage: false });
  });
}
