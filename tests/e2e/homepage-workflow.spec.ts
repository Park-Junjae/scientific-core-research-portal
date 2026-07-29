import { expect, test, type Page } from "@playwright/test";
import {
  fixtureRunId,
  fixtureDisplayTitle,
  installPrivateWorkspaceRoutes,
  legacyLongResearchQuestion,
  seedSubmittedSummary,
} from "./fixtures/private-workspace";

const question = "Which controllable state preserves product purity without sacrificing activity?";

async function connectAndFill(page: Page) {
  await page.goto("/?lang=en");
  const composer = page.locator(".research-composer-shell");
  await expect(composer.getByText("creator@example.com", { exact: true })).toBeVisible();
  await composer.getByRole("textbox", { name: /Research goal/ }).fill(question);
  await composer.getByText("Options", { exact: true }).click();
  await composer.getByRole("textbox", { name: "Objectives" }).fill("Identify a discriminating mechanism\nPreserve product activity");
  await composer.getByRole("textbox", { name: "Constraints", exact: true }).fill("Use fixture evidence only\nKeep provider usage at zero");
  return composer;
}

test("homepage Standard request preserves the lean production payload", async ({ page }) => {
  const api = await installPrivateWorkspaceRoutes(page);
  const composer = await connectAndFill(page);

  await composer.getByRole("button", { name: "Start preflight" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/run-control/\\?run_id=${fixtureRunId}&lang=en&created=1`),
  );
  await expect(page.getByText("Request submitted. Starting preflight.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compiled research plan" })).toBeVisible();

  expect(api.submittedBody).toMatchObject({
    research_question: question,
    objectives: ["Identify a discriminating mechanism", "Preserve product activity"],
    constraints: ["Use fixture evidence only", "Keep provider usage at zero"],
    requested_mode: "AUTO",
    execution_mode: "PROVIDER_BACKED",
    budget_profile: "standard",
  });
  expect(api.submittedBody).not.toHaveProperty("creativity_profile");
  expect(api.submittedBody).not.toHaveProperty("creativity_profile_selection_reviewed");
  expect(api.submittedBody).not.toHaveProperty("raw_spark_target");
  expect(api.runnerApiCalls).toBe(0);
});

test("homepage Breakthrough request sends the reviewed discovery contract", async ({ page }) => {
  const api = await installPrivateWorkspaceRoutes(page);
  const composer = await connectAndFill(page);

  await composer.getByRole("radio", { name: /breakthrough discovery/i }).check();
  await expect(composer.getByRole("radio", { name: /breakthrough discovery/i })).toBeChecked();
  await composer.getByRole("button", { name: "Start preflight" }).click();
  await expect(page).toHaveURL(new RegExp(`/run-control/\\?run_id=${fixtureRunId}`));

  expect(api.submittedBody).toMatchObject({
    research_question: question,
    requested_mode: "DISCOVERY_PORTFOLIO_RUN",
    creativity_profile: "BREAKTHROUGH_DISCOVERY",
    creativity_profile_selection_reviewed: true,
    raw_spark_target: 60,
    budget_profile: "breakthrough_discovery",
  });
  expect(api.runnerApiCalls).toBe(0);
});

test("zero-provider preflight is explicit before a compiled contract exists", async ({ page }) => {
  const api = await installPrivateWorkspaceRoutes(page, "PREFLIGHT");
  await seedSubmittedSummary(page);
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);

  await expect(page.getByRole("heading", { name: "Compiling the research plan" })).toBeVisible();
  await expect(page.getByText("0 calls · 0 tokens · USD 0")).toBeVisible();
  await expect(page.getByText("Provider usage remains zero.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compiled research plan" })).not.toBeVisible();
  expect(api.runnerApiCalls).toBe(0);
});

test("creator can self-approve, refresh, re-enter, and cancel the same private run", async ({ page }) => {
  const api = await installPrivateWorkspaceRoutes(page, "AWAITING_APPROVAL");
  await seedSubmittedSummary(page);
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);

  await expect(page.getByRole("heading", { name: "Research scope review" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Research goal" }).getByText(question),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Approve my execution" })).toBeVisible();
  await page.getByRole("checkbox", { name: /reviewed the compiled plan/ }).check();
  await page.getByRole("button", { name: "Approve my execution" }).click();

  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Research stage progress" })).toBeVisible();
  expect(api.status).toBe("RUNNING");

  await page.reload();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Refresh status" }).click();
  await expect(page.getByText("Approved research is running.")).toBeVisible();

  await page.getByRole("button", { name: "Cancel run" }).click();
  await expect(page.locator(".run-state-band > div").first().getByText("CANCELLED", { exact: true })).toBeVisible();
  expect(api.status).toBe("CANCELLED");
  expect(api.runnerApiCalls).toBe(0);
});

test("My Research renders only the authenticated creator projection", async ({ page }) => {
  const api = await installPrivateWorkspaceRoutes(page, "RUNNING", { list: "current" });
  await page.goto("/?lang=en");

  const research = page.locator(".my-research-section");
  await expect(research.getByRole("link", { name: fixtureDisplayTitle })).toBeVisible();
  await expect(research.getByText("Breakthrough Discovery")).toBeVisible();
  await expect(research.getByText("42%").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("another creator's private question");
  expect(api.runnerApiCalls).toBe(0);
});

test("My Research compacts a legacy 4,000-character prompt and never renders the raw body", async ({ page }) => {
  await installPrivateWorkspaceRoutes(page, "RUNNING", { list: "legacy-long" });
  await page.goto("/?lang=en");

  const research = page.locator(".my-research-section");
  const title = research.getByRole("link", {
    name: "RNA-mediated mitochondrial DNA/RNA base editing.",
  });
  await expect(title).toBeVisible();
  await expect(title).toHaveCSS("-webkit-line-clamp", "2");
  await expect(research).not.toContainText(
    "Private detailed instruction that must never appear in My Research.",
  );
  await expect(page.locator("body")).not.toContainText(legacyLongResearchQuestion);
});

test("rapid double submission sends exactly one POST and exposes the pending state", async ({ page }) => {
  const api = await installPrivateWorkspaceRoutes(page, "AWAITING_APPROVAL", {
    postDelayMs: 350,
  });
  const composer = await connectAndFill(page);
  const button = composer.getByRole("button", { name: "Start preflight" });
  await button.evaluate((element) => {
    const form = element.closest("form");
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });

  await expect(
    composer.getByRole("button", { name: "Submitting preflight…" }),
  ).toBeDisabled();
  await expect(composer.locator(".intake-message")).toContainText("Submitting preflight…");
  await expect(page).toHaveURL(new RegExp(`/run-control/\\?run_id=${fixtureRunId}`));
  expect(api.postCount).toBe(1);
});

test("network failure restores the composer without automatic resubmission", async ({ page }) => {
  const api = await installPrivateWorkspaceRoutes(page, "AWAITING_APPROVAL", {
    failFirstPost: true,
  });
  const composer = await connectAndFill(page);
  await composer.getByRole("button", { name: "Start preflight" }).click();

  await expect(composer.getByRole("button", { name: "Start preflight" })).toBeEnabled();
  await expect(composer.getByRole("alert")).toContainText(
    "Unable to reach the Run Control API",
  );
  expect(api.postCount).toBe(1);
  await expect(page).toHaveURL(/\/\?lang=en$/);
});

test("Run detail uses a compact heading and keeps the full goal in its own section", async ({ page }) => {
  await installPrivateWorkspaceRoutes(page, "PREFLIGHT");
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);

  await expect(page.getByRole("heading", { name: fixtureDisplayTitle })).toBeVisible();
  const goal = page.getByRole("region", { name: "Research goal" });
  await expect(goal).toContainText(question);
  await expect(page.getByRole("link", { name: "← My Research" })).toBeVisible();
});

test("completed run is artifact-first and reads the canonical report privately", async ({ page }) => {
  const api = await installPrivateWorkspaceRoutes(page, "COMPLETED");
  await seedSubmittedSummary(page);
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);

  await expect(page.getByRole("heading", { name: "Research result artifacts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mechanism-first research report" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download PDF" })).toHaveAttribute("href", /disposition=attachment/);
  await expect(page.getByRole("link", { name: /Download Markdown/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Download ZIP/ })).toBeVisible();
  await page.getByRole("button", { name: "Open PDF" }).click();
  await expect(page.locator("iframe.private-pdf-frame")).toBeVisible();
  expect(api.artifactDownloads).toBe(1);
  expect(api.runnerApiCalls).toBe(0);
});
