import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const output = join(process.cwd(), "UPDATED_SCREENSHOTS");

test.beforeAll(() => mkdirSync(output, { recursive: true }));
test.beforeEach(async ({ page }) => page.addInitScript(() => localStorage.clear()));

const cases = [
  { name: "new-run-ko-desktop-empty", locale: "ko", viewport: { width: 1440, height: 900 }, fill: false },
  { name: "new-run-en-desktop-filled", locale: "en", viewport: { width: 1440, height: 900 }, fill: true },
  { name: "new-run-ko-mobile-filled", locale: "ko", viewport: { width: 390, height: 844 }, fill: true },
  { name: "new-run-en-mobile-empty", locale: "en", viewport: { width: 390, height: 844 }, fill: false },
] as const;

for (const item of cases) {
  test(`capture ${item.name}`, async ({ page }) => {
    await page.setViewportSize(item.viewport);
    await page.goto(`/new-run/?lang=${item.locale}`);
    await page.waitForFunction((locale) => document.documentElement.lang === locale, item.locale);
    if (item.fill) {
      const input = item.locale === "ko"
        ? "미토콘드리아 염기교정에서 표적 효율을 유지하면서 부산물 편집을 줄이는 기전을 찾고 싶습니다."
        : "Identify a mechanism that improves product purity without proportionally reducing on-target editing.";
      await page.locator(".primary-request-field textarea").fill(input);
      await expect(page.getByRole("radio", { name: /STANDARD/ })).toBeChecked();
    } else {
      await expect(page.locator(".primary-request-field textarea")).toBeEmpty();
      await expect(page.getByRole("radio", { name: /STANDARD/ })).toBeChecked();
    }
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await page.screenshot({
      path: join(output, `${item.name}-${item.viewport.width}x${item.viewport.height}.png`),
      fullPage: false,
    });
  });
}
