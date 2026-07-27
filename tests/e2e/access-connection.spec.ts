import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("Cloudflare challenge HTML asks for an interactive lab-account connection", async ({ page }) => {
  await page.route("https://control.example/api/session", (route) => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><title>Cloudflare Access</title></html>",
  }));
  await page.goto("/?lang=en");
  const section = page.locator(".my-research-section");
  await expect(section.getByRole("link", { name: "Connect lab account" })).toHaveAttribute(
    "target",
    "_blank",
  );
  await section.getByRole("button", { name: "Check connection" }).click();
  await expect(section.getByText(/Cloudflare Access sign-in is required/)).toBeVisible();
});

test("network or CORS failure is distinct from an Access challenge", async ({ page }) => {
  await page.route("https://control.example/api/session", (route) => route.abort("failed"));
  await page.goto("/?lang=en");
  const section = page.locator(".my-research-section");
  await section.getByRole("button", { name: "Check connection" }).click();
  await expect(section.getByText(/could not reach the API/)).toBeVisible();
  await expect(section).not.toContainText("Cloudflare Access sign-in is required");
});

test("authenticated JSON loads an explicit empty private workspace", async ({ page }) => {
  await page.route("https://control.example/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/session") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          authenticated: true,
          email: "approved@example.com",
          csrf_token: "fixture-csrf",
        }),
        headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:4175",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }
    if (pathname === "/api/runs") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          runs: [],
          limit: 20,
          offset: 0,
          next_offset: null,
        }),
        headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:4175",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }
    return route.fulfill({ status: 404, body: "{}" });
  });
  await page.goto("/?lang=en");
  const section = page.locator(".my-research-section");
  await section.getByRole("button", { name: "Check connection" }).click();
  await expect(section.getByRole("heading", { name: "No research for this account yet." })).toBeVisible();
  await expect(section.getByText(/Separate from public static runs/)).toBeVisible();
});

test("a non-allowlisted Backend response is clearly identified", async ({ page }) => {
  await page.route("https://control.example/api/session", (route) => route.fulfill({
    status: 403,
    contentType: "application/json",
    body: JSON.stringify({ detail: "Access identity is not allowlisted" }),
    headers: {
      "Access-Control-Allow-Origin": "http://127.0.0.1:4175",
      "Access-Control-Allow-Credentials": "true",
    },
  }));
  await page.goto("/?lang=en");
  const section = page.locator(".my-research-section");
  await section.getByRole("button", { name: "Check connection" }).click();
  await expect(section.getByText(/not on the lab allowlist/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("fixture-csrf");
});
