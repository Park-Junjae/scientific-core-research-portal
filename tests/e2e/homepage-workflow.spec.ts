import { expect, test, type Page } from "@playwright/test";
import {
  fixtureDisplayTitle,
  fixtureRunId,
  installPrivateWorkspaceRoutes,
  legacyLongResearchQuestion,
  seedSubmittedSummary,
} from "./fixtures/private-workspace";

const question = "Which controllable state preserves product purity without sacrificing activity?";

async function connectAndFill(page: Page) {
  await page.goto("/?lang=en");
  const composer = page.locator(".research-composer-shell");
  await expect(
    composer.getByText("creator@example.com", { exact: true }),
  ).toBeVisible();
  await composer.getByRole("textbox", { name: /Research goal/ }).fill(question);
  await composer.getByText("Options", { exact: true }).click();
  await composer.getByRole("textbox", { name: "Objectives" }).fill(
    "Identify a discriminating mechanism\nPreserve product activity",
  );
  await composer.getByRole("textbox", { name: "Constraints", exact: true }).fill(
    "Use fixture evidence only\nKeep provider usage at zero",
  );
  return composer;
}

test("Start research submits Standard directly and opens its status page", async ({
  page,
}) => {
  const api = await installPrivateWorkspaceRoutes(page);
  const composer = await connectAndFill(page);

  await composer.getByRole("button", { name: "Start research" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/run-control/\\?run_id=${fixtureRunId}&lang=en&created=1`),
  );
  await expect(page.getByText("Starting research.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Starting" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Compiled research plan/i }))
    .toHaveCount(0);
  await expect(page.getByRole("button", { name: /Approve/i })).toHaveCount(0);

  expect(api.submittedBody).toMatchObject({
    research_question: question,
    objectives: [
      "Identify a discriminating mechanism",
      "Preserve product activity",
    ],
    constraints: [
      "Use fixture evidence only",
      "Keep provider usage at zero",
    ],
    requested_mode: "FOCUSED_DECISION_RUN",
    execution_mode: "PROVIDER_BACKED",
    budget_profile: "standard",
  });
  expect(api.submittedBody).not.toHaveProperty("runtime_ref");
  expect(api.submittedBody).not.toHaveProperty("provider_policy_version");
  expect(api.submittedBody).not.toHaveProperty("creativity_profile");
  expect(api.runnerApiCalls).toBe(0);
});

test("Start research submits the reviewed Breakthrough contract directly", async ({
  page,
}) => {
  const api = await installPrivateWorkspaceRoutes(page);
  const composer = await connectAndFill(page);

  await composer.getByRole(
    "radio",
    { name: /breakthrough discovery/i },
  ).check();
  await composer.getByRole("button", { name: "Start research" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/run-control/\\?run_id=${fixtureRunId}`),
  );

  expect(api.submittedBody).toMatchObject({
    research_question: question,
    requested_mode: "DISCOVERY_PORTFOLIO_RUN",
    creativity_profile: "BREAKTHROUGH_DISCOVERY",
    creativity_profile_selection_reviewed: true,
    raw_spark_target: 60,
    budget_profile: "breakthrough_discovery",
  });
  expect(api.submittedBody).not.toHaveProperty("runtime_ref");
  expect(api.runnerApiCalls).toBe(0);
});

test("provider gate disabled is shown after local validation without approval UX", async ({
  page,
}) => {
  const api = await installPrivateWorkspaceRoutes(page, "QUEUED");
  await seedSubmittedSummary(page);
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);

  await expect(
    page.locator(".run-control-header").getByText(
      "Research execution is temporarily disabled.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Queued" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Approve/i })).toHaveCount(0);
  await expect(page.getByText(/preflight/i)).toHaveCount(0);
  expect(api.runnerApiCalls).toBe(0);
});

test("status automatically advances and creator can cancel without manual refresh", async ({
  page,
}) => {
  const api = await installPrivateWorkspaceRoutes(page, "STARTING");
  await seedSubmittedSummary(page);
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);

  await expect(page.getByText("Starting", { exact: true }).first()).toBeVisible();
  api.setStatus("RUNNING");
  await expect(page.getByText("Running", { exact: true }).first())
    .toBeVisible({ timeout: 12_000 });
  await expect(page.getByRole("heading", { name: "Research progress" }))
    .toBeVisible();
  await expect(page.getByRole("button", { name: /Refresh status/i }))
    .toHaveCount(0);

  await expect(page.getByText("Private research is running.")).toBeVisible();
  await page.getByRole("button", { name: "Cancel research" }).click();
  await expect(page.getByText("Cancelled", { exact: true }).first())
    .toBeVisible();
  expect(api.status).toBe("CANCELLED");
  expect(api.runnerApiCalls).toBe(0);
});

test("My Research renders only the authenticated creator projection", async ({
  page,
}) => {
  const api = await installPrivateWorkspaceRoutes(
    page,
    "RUNNING",
    { list: "current" },
  );
  await page.goto("/?lang=en");

  const research = page.locator(".my-research-section");
  await expect(
    research.getByRole("link", { name: fixtureDisplayTitle }),
  ).toBeVisible();
  await expect(research.getByText("Breakthrough Discovery")).toBeVisible();
  await expect(research.getByText("42%").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    "another creator's private question",
  );
  expect(api.runnerApiCalls).toBe(0);
});

test("My Research compacts a legacy long prompt and never renders its body", async ({
  page,
}) => {
  await installPrivateWorkspaceRoutes(
    page,
    "RUNNING",
    { list: "legacy-long" },
  );
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
  await expect(page.locator("body")).not.toContainText(
    legacyLongResearchQuestion,
  );
});

test("rapid double submission sends one POST and exposes direct-start pending state", async ({
  page,
}) => {
  const api = await installPrivateWorkspaceRoutes(
    page,
    "STARTING",
    { postDelayMs: 350 },
  );
  const composer = await connectAndFill(page);
  const button = composer.getByRole("button", { name: "Start research" });
  await button.evaluate((element) => {
    const form = element.closest("form");
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });

  await expect(
    composer.getByRole("button", { name: "Starting research…" }),
  ).toBeDisabled();
  await expect(composer.locator(".intake-message")).toContainText(
    "Starting research…",
  );
  await expect(page).toHaveURL(
    new RegExp(`/run-control/\\?run_id=${fixtureRunId}`),
  );
  expect(api.postCount).toBe(1);
});

test("network failure restores the composer without automatic resubmission", async ({
  page,
}) => {
  const api = await installPrivateWorkspaceRoutes(
    page,
    "STARTING",
    { failFirstPost: true },
  );
  const composer = await connectAndFill(page);
  await composer.getByRole("button", { name: "Start research" }).click();

  await expect(composer.getByRole("button", { name: "Start research" }))
    .toBeEnabled();
  await expect(composer.getByRole("alert")).toContainText(
    "Unable to reach the Run Control API",
  );
  expect(api.postCount).toBe(1);
  await expect(page).toHaveURL(/\/\?lang=en$/);
});

test("Run detail uses a compact heading and collapsed diagnostics", async ({
  page,
}) => {
  await installPrivateWorkspaceRoutes(page, "STARTING");
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);

  await expect(
    page.getByRole("heading", { name: fixtureDisplayTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Research goal" }),
  ).toContainText(question);
  await expect(page.getByText("Diagnostics", { exact: true })).toBeVisible();
  await expect(page.locator(".run-diagnostics")).not.toHaveAttribute("open", "");
  await expect(
    page.getByRole("link", { name: "← My Research" }),
  ).toBeVisible();
});

test("completed research is artifact-first and reads the report privately", async ({
  page,
}) => {
  const api = await installPrivateWorkspaceRoutes(page, "COMPLETED");
  await seedSubmittedSummary(page);
  await page.goto(`/run-control/?run_id=${fixtureRunId}&lang=en`);

  await expect(
    page.getByRole("heading", { name: "Research result artifacts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Mechanism-first research report" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Download PDF" }))
    .toHaveAttribute("href", /disposition=attachment/);
  await expect(page.getByRole("link", { name: /Download Markdown/ }))
    .toBeVisible();
  await expect(page.getByRole("link", { name: /Download ZIP/ })).toBeVisible();
  await page.getByRole("button", { name: "Open PDF" }).click();
  await expect(page.locator("iframe.private-pdf-frame")).toBeVisible();
  expect(api.artifactDownloads).toBe(1);
  expect(api.runnerApiCalls).toBe(0);
});
