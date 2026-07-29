import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("run control browser client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("uses credentialed server sessions and never sends a browser token", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: true, email: "approved@example.com", csrf_token: "csrf" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getRunControlSession } = await import("./run-control-api");
    await getRunControlSession();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://control.example/api/session",
      expect.objectContaining({ credentials: "include" }),
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toBeUndefined();
    expect(JSON.stringify(init)).not.toMatch(/authorization|api[_-]?key|github[_-]?token/i);
  });

  it("posts only scientific request fields plus the CSRF header", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ run_id: "run-safe" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createControlledRun } = await import("./run-control-api");
    await createControlledRun(
      { research_question: "Synthetic question", budget_profile: "standard" },
      "csrf-only",
      "portal-request-locator-0001",
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("X-CSRF-Token")).toBe("csrf-only");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({
      research_question: "Synthetic question",
      budget_profile: "standard",
      request_locator: "portal-request-locator-0001",
    }));
  });

  it("preserves CSRF without adding Content-Type to a bodyless mutation", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ run_id: "run-safe" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { cancelControlledRun } = await import("./run-control-api");
    await cancelControlledRun("run-safe", "csrf-only");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("X-CSRF-Token")).toBe("csrf-only");
    expect(headers.has("Content-Type")).toBe(false);
    expect(init.body).toBeUndefined();
  });

  it("reads private artifacts through the authenticated session without a browser token", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["private"]),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { readPrivateArtifact } = await import("./run-control-api");
    await readPrivateArtifact("run-owner", "artifact-summary");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://control.example/api/runs/run-owner/artifacts/artifact-summary/download?disposition=inline",
      { credentials: "include" },
    );
    expect(JSON.stringify(fetchMock.mock.calls[0][1])).not.toMatch(
      /authorization|api[_-]?key|github[_-]?token/i,
    );
  });

  it("omits creativity metadata for Standard and binds it for Breakthrough", async () => {
    const { buildControlledRunPayload } = await import("./run-control-api");
    const common = {
      researchQuestion: "Why does product purity vary?",
      objectives: ["Preserve activity"],
      constraints: ["No exact sequence design"],
      requestedMode: "AUTO" as const,
      includeLiteratureScope: true,
      reportLanguage: "en",
    };
    const standard = buildControlledRunPayload({
      ...common,
      creativityProfile: "STANDARD",
    });
    expect(standard).not.toHaveProperty("creativity_profile");
    expect(standard.budget_profile).toBe("standard");
    expect(standard.requested_mode).toBe("FOCUSED_DECISION_RUN");

    const breakthrough = buildControlledRunPayload({
      ...common,
      creativityProfile: "BREAKTHROUGH_DISCOVERY",
    });
    expect(breakthrough).toMatchObject({
      creativity_profile: "BREAKTHROUGH_DISCOVERY",
      creativity_profile_selection_reviewed: true,
      raw_spark_target: 60,
      budget_profile: "breakthrough_discovery",
      requested_mode: "DISCOVERY_PORTFOLIO_RUN",
    });
  });

  it("keeps every selectable Portal mode inside the production Backend schema", async () => {
    const schema = JSON.parse(readFileSync(
      join(process.cwd(), "tests/fixtures/contracts/run-request-v1.schema.json"),
      "utf8",
    ));
    const backendModes = schema.properties.request.properties.requested_mode.enum;
    const { PORTAL_SELECTABLE_RUN_MODES } = await import("./run-control-api");
    expect([...PORTAL_SELECTABLE_RUN_MODES].sort()).toEqual([...backendModes].sort());
  });

  it("keeps V2 status counts top-level and recognizes every deployed stage", () => {
    const schema = JSON.parse(readFileSync(
      join(process.cwd(), "tests/fixtures/contracts/run-status-event-v2.schema.json"),
      "utf8",
    ));
    expect(schema.properties).not.toHaveProperty("metrics");
    expect(schema.properties).toEqual(expect.objectContaining({
      raw_idea_count: expect.any(Object),
      independent_idea_count: expect.any(Object),
      family_count: expect.any(Object),
      developed_proposal_count: expect.any(Object),
    }));
    expect(schema.properties.stage.enum).toEqual(expect.arrayContaining([
      "blind_multi_lens_ideation",
      "novelty_and_precedent_audit",
      "mechanism_family_grouping",
      "dual_axis_portfolio",
      "synthesis",
      "publication_packaging",
    ]));
  });

  it("parses the shared creator list fixture generated by the Backend response", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    const fixture = JSON.parse(readFileSync(
      join(process.cwd(), "tests/fixtures/contracts/creator-run-list-response.json"),
      "utf8",
    ));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fixture,
    }));

    const { getMyRuns } = await import("./run-control-api");
    const response = await getMyRuns();
    expect(response).toEqual(fixture);
    expect(response.runs[0]).toMatchObject({
      current_stage: "blind_multi_lens_ideation",
      progress_percentage: 35,
      provider_cost_usd: 0,
      artifact_availability: { available: true, roles: ["artifact_manifest"] },
    });
  });

  it("classifies Cloudflare challenge HTML separately from invalid JSON", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      redirected: false,
      headers: new Headers({ "content-type": "text/html" }),
      text: async () => "<!doctype html><html><title>Cloudflare Access</title></html>",
    }));

    const { getRunControlSession } = await import("./run-control-api");
    await expect(getRunControlSession()).rejects.toMatchObject({
      kind: "ACCESS_CHALLENGE",
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      redirected: false,
      headers: new Headers({ "content-type": "text/plain" }),
      text: async () => "not-json",
    }));
    await expect(getRunControlSession()).rejects.toMatchObject({
      kind: "INVALID_RESPONSE",
    });
  });

  it("classifies network and non-allowlisted failures without exposing credentials", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    const networkFetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", networkFetch);
    const { getRunControlSession } = await import("./run-control-api");
    await expect(getRunControlSession()).rejects.toMatchObject({ kind: "NETWORK" });

    const deniedFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ detail: "Access identity is not allowlisted" }),
    });
    vi.stubGlobal("fetch", deniedFetch);
    await expect(getRunControlSession()).rejects.toMatchObject({
      kind: "NOT_ALLOWLISTED",
      status: 403,
    });
    expect(JSON.stringify(deniedFetch.mock.calls)).not.toMatch(
      /authorization|api[_-]?key|github[_-]?token|csrf[_-]?token/i,
    );
  });

  it("honors 429 backoff metadata", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      headers: new Headers({
        "content-type": "application/json",
        "retry-after": "45",
      }),
      text: async () => JSON.stringify({ detail: "Rate limit exceeded" }),
    }));
    const { getControlledRun } = await import("./run-control-api");
    await expect(getControlledRun("run-owner")).rejects.toMatchObject({
      kind: "RATE_LIMITED",
      retryAfterMs: 45_000,
    });
  });

  it("keeps deterministic sustained status polling below the Backend rate limit", async () => {
    const {
      BACKEND_RATE_LIMIT_PER_MINUTE,
      RUN_STATUS_POLL_INTERVAL_MS,
      sustainedStatusRequestsPerMinute,
    } = await import("./run-control-api");
    expect(RUN_STATUS_POLL_INTERVAL_MS).toBe(10_000);
    expect(sustainedStatusRequestsPerMinute()).toBe(6);
    expect(sustainedStatusRequestsPerMinute()).toBeLessThan(
      BACKEND_RATE_LIMIT_PER_MINUTE,
    );
  });
});
