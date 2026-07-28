import { expect, test } from "@playwright/test";

const session = {
  authenticated: true,
  email: "approved@example.com",
  csrf_token: "fixture-csrf",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("GET /api/session is automatic and has no preflight-triggering Content-Type", async ({ page }) => {
  let sessionRequests = 0;
  await page.route("https://control.example/**", (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/api/session") {
      sessionRequests += 1;
      expect(request.method()).toBe("GET");
      expect(request.headers()["content-type"]).toBeUndefined();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
    }
    if (pathname === "/api/runs") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ runs: [], limit: 20, offset: 0, next_offset: null }),
      });
    }
    return route.fulfill({ status: 404, body: "{}" });
  });

  await page.goto("/?lang=en");
  await expect(page.getByText("approved@example.com", { exact: true })).toBeVisible();
  expect(sessionRequests).toBeGreaterThanOrEqual(1);
});

test("focus automatically rechecks a previously unauthenticated session", async ({ page }) => {
  let sessionRequests = 0;
  let authenticated = false;
  await page.route("https://control.example/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/session") {
      sessionRequests += 1;
      if (!authenticated) {
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Cloudflare session is required" }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
    }
    if (pathname === "/api/runs") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ runs: [], limit: 20, offset: 0, next_offset: null }),
      });
    }
    return route.fulfill({ status: 404, body: "{}" });
  });

  await page.goto("/?lang=en");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  authenticated = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("approved@example.com", { exact: true })).toBeVisible();
  expect(sessionRequests).toBeGreaterThanOrEqual(2);
});

test("visibilitychange rechecks when the document becomes visible", async ({ page }) => {
  let sessionRequests = 0;
  let authenticated = false;
  await page.route("https://control.example/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/session") {
      sessionRequests += 1;
      return route.fulfill({
        status: authenticated ? 200 : 401,
        contentType: "application/json",
        body: JSON.stringify(authenticated
          ? session
          : { detail: "Cloudflare session is required" }),
      });
    }
    if (pathname === "/api/runs") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ runs: [], limit: 20, offset: 0, next_offset: null }),
      });
    }
    return route.fulfill({ status: 404, body: "{}" });
  });

  await page.goto("/?lang=en");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  authenticated = true;
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByText("approved@example.com", { exact: true })).toBeVisible();
  expect(sessionRequests).toBeGreaterThanOrEqual(2);
});

test("unauthenticated state has one Continue with Google button", async ({ page }) => {
  await page.route("https://control.example/api/session", (route) => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><title>Cloudflare Access</title></html>",
  }));

  await page.goto("/?lang=en");
  const account = page.getByRole("region", { name: "Account connection" });
  await expect(account.getByRole("button", { name: "Continue with Google" })).toHaveCount(1);
  await expect(account.getByText(/Cloudflare Access sign-in/)).toBeVisible();
  await expect(account.getByRole("button", { name: /check connection/i })).toHaveCount(0);
});

test("connected state shows the email and no account action button", async ({ page }) => {
  await page.route("https://control.example/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/session") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
    }
    if (pathname === "/api/runs") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ runs: [], limit: 20, offset: 0, next_offset: null }),
      });
    }
    return route.fulfill({ status: 404, body: "{}" });
  });

  await page.goto("/?lang=en");
  const account = page.getByRole("region", { name: "Account connection" });
  await expect(account.getByText("approved@example.com", { exact: true })).toBeVisible();
  await expect(account.getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "My Research" })).toBeVisible();
  await expect(page.getByText("No research runs yet.", { exact: true })).toBeVisible();
});
