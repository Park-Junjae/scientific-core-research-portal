import { expect, test, type Page } from "@playwright/test";
import {
  fixtureRunId,
  fixtureRuntimeRef,
  installPrivateWorkspaceRoutes,
  seedSubmittedSummary,
} from "./fixtures/private-workspace";

const question = "Which controllable state preserves product purity without sacrificing activity?";

async function connectAndFill(page: Page) {
  await page.goto("/?lang=en");
  const composer = page.locator(".research-composer-shell");
  await composer.getByRole("button", { name: "Check connection" }).click();
  await composer.getByRole("textbox", { name: /Research question/ }).fill(question);
  await composer.getByRole("textbox", { name: /Objectives/ }).fill("Identify a discriminating mechanism\nPreserve product activity");
  await composer.getByRole("textbox", { name: /Experimental constraints/ }).fill("Use fixture evidence only\nKeep provider usage at zero");
  return composer;
}

test("homepage Standard request preserves the lean production payload", async ({ page }) => {
  const api = await installPrivateWorkspaceRoutes(page);
  const composer = await connectAndFill(page);

  await composer.getByRole("button", { name: "Review research plan" }).click();
  await expect(page).toHaveURL(new RegExp(`/run-control/\\?run_id=${fixtureRunId}`));
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
  await expect(composer.getByText(fixtureRuntimeRef)).toBeVisible();
  await composer.getByRole("button", { name: "Review research plan" }).click();
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
  await expect(page.getByText(question)).toBeVisible();
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
  await page.locator(".research-composer-shell").getByRole("button", { name: "Check connection" }).click();

  const research = page.locator(".my-research-section");
  await expect(research.getByRole("link", { name: question })).toBeVisible();
  await expect(research.getByText("Breakthrough Discovery")).toBeVisible();
  await expect(research.getByText("42%").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("another creator's private question");
  expect(api.runnerApiCalls).toBe(0);
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
