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
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ "X-CSRF-Token": "csrf-only" });
    expect(init.body).toBe(JSON.stringify({
      research_question: "Synthetic question",
      budget_profile: "standard",
    }));
  });
});
