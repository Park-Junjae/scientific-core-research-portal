/**
 * Run Control rejects a provider-backed Breakthrough run whose report language is
 * not bilingual — and it rejects it after dispatch, so the operator watches a run
 * they already started fail on a setting the composer let them choose. The default
 * ("Current portal language") resolves to ko, which is exactly the rejected value.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider, defaultPreferences } from "@/lib/preferences";
import { buildControlledRunPayload, createControlledRun } from "@/lib/run-control-api";
import { ResearchComposer } from "./new-run-builder";

vi.mock("@/lib/locale", () => ({ useLocale: () => ({ locale: "ko" }) }));
vi.mock("@/lib/paths", () => ({ withBasePath: (value: string) => value }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/run-control-api", () => ({
  runControlApiBase: "https://api.test",
  createControlledRun: vi.fn(async () => ({ run_id: "run-test" })),
  buildControlledRunPayload: vi.fn((input: unknown) => input),
}));
vi.mock("@/components/access-connection-panel", () => ({
  AccessConnectionPanel: () => null,
}));

const STORAGE_KEY = "scientific-core-preferences";

const SESSION = {
  authenticated: true as const,
  email: "operator@example.org",
  csrf_token: "csrf-token",
};

function mount(overrides: Partial<typeof defaultPreferences> = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultPreferences, ...overrides }));
  return render(
    <PreferencesProvider>
      <ResearchComposer session={SESSION} />
    </PreferencesProvider>,
  );
}

const languageSelect = () =>
  screen.getByLabelText(/보고서 언어|Report language/) as HTMLSelectElement;

const modeRadio = (value: string) =>
  document.querySelector<HTMLInputElement>(`input[value="${value}"]`)!;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("report language under Breakthrough Discovery", () => {
  it("is fixed to bilingual and cannot be changed", async () => {
    mount();
    fireEvent.click(modeRadio("BREAKTHROUGH_DISCOVERY"));

    await waitFor(() => expect(languageSelect().value).toBe("bilingual"));
    expect(languageSelect().disabled).toBe(true);
  });

  it("says why the choice is not offered", async () => {
    mount();
    fireEvent.click(modeRadio("BREAKTHROUGH_DISCOVERY"));

    await waitFor(() =>
      expect(screen.getByText(/한국어와 English 두 언어|both Korean and English/)).toBeTruthy(),
    );
  });

  it("dispatches bilingual even when a rejected language was already chosen", async () => {
    // The saved preference survives a switch into Breakthrough; without the fix it
    // is what reaches Run Control, and the run fails after it has been accepted.
    mount({ defaultReportLanguage: "ko" });
    await waitFor(() => expect(languageSelect().value).toBe("ko"));
    fireEvent.click(modeRadio("BREAKTHROUGH_DISCOVERY"));

    fireEvent.change(
      screen.getByPlaceholderText(/어떤 연구|What research/),
      { target: { value: "RNA-mediated base editing of mtDNA." } },
    );
    fireEvent.click(screen.getByRole("button", { name: /Continue|계속|시작/ }));

    await waitFor(() => expect(createControlledRun).toHaveBeenCalled());
    const payload = vi.mocked(buildControlledRunPayload).mock.calls[0][0] as {
      reportLanguage: string;
    };
    expect(payload.reportLanguage).toBe("bilingual");
  });

  it("leaves the choice open for standard runs", async () => {
    mount();

    expect(languageSelect().disabled).toBe(false);
    fireEvent.change(languageSelect(), { target: { value: "en" } });
    expect(languageSelect().value).toBe("en");
  });
});
