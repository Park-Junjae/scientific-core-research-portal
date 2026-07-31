import { afterEach, describe, expect, it, vi } from "vitest";

describe("Run lifecycle browser API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("requests active and archived creator lists without GET content headers", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ runs: [], limit: 20, offset: 0, next_offset: null }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { getMyRuns } = await import("./run-control-api");

    await getMyRuns(20, 0, false);
    await getMyRuns(20, 0, true);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://control.example/api/runs?limit=20&offset=0&archived=false",
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://control.example/api/runs?limit=20&offset=0&archived=true",
    );
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toMatchObject({ credentials: "include" });
      expect((init as RequestInit).headers).toBeUndefined();
    }
  });

  it("preserves CSRF on bodyless archive and restore requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ run_id: "run-lifecycle" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { archiveControlledRun, restoreControlledRun } = await import("./run-control-api");

    await archiveControlledRun("run-lifecycle", "csrf-only");
    await restoreControlledRun("run-lifecycle", "csrf-only");

    for (const [url, init] of fetchMock.mock.calls) {
      expect(url).toMatch(/\/api\/runs\/run-lifecycle\/(?:archive|restore)$/);
      const headers = new Headers((init as RequestInit).headers);
      expect(headers.get("X-CSRF-Token")).toBe("csrf-only");
      expect(headers.has("Content-Type")).toBe(false);
      expect((init as RequestInit).body).toBeUndefined();
    }
  });

  it("binds DELETE to the exact Run ID, CSRF, and idempotency key", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUN_CONTROL_API_BASE", "https://control.example");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "DELETED",
        run_id: "run-delete-exact",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { deleteControlledRun } = await import("./run-control-api");

    await deleteControlledRun(
      "run-delete-exact",
      "csrf-delete",
      "portal-delete:00000001",
      "system_validation_cleanup",
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://control.example/api/runs/run-delete-exact");
    expect(init.method).toBe("DELETE");
    const headers = new Headers(init.headers);
    expect(headers.get("X-CSRF-Token")).toBe("csrf-delete");
    expect(headers.get("Idempotency-Key")).toBe("portal-delete:00000001");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual({
      confirmation_token: "run-delete-exact",
      deletion_reason: "system_validation_cleanup",
    });
  });
});
