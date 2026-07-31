import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider, defaultPreferences } from "@/lib/preferences";
import { ResearchComposer } from "./new-run-builder";

vi.mock("@/lib/locale", () => ({ useLocale: () => ({ locale: "ko" }) }));
vi.mock("@/lib/paths", () => ({ withBasePath: (value: string) => value }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/run-control-api", () => ({
  runControlApiBase: "",
  createControlledRun: vi.fn(),
  buildControlledRunPayload: vi.fn(),
}));
vi.mock("@/components/access-connection-panel", () => ({
  AccessConnectionPanel: () => null,
}));

const STORAGE_KEY = "scientific-core-preferences";

function store(overrides: Partial<typeof defaultPreferences>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultPreferences, ...overrides }));
}

function mount() {
  return render(
    <PreferencesProvider>
      <ResearchComposer />
    </PreferencesProvider>,
  );
}

const modeRadio = (value: string) =>
  document.querySelector<HTMLInputElement>(`input[value="${value}"]`);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("composer defaults from preferences", () => {
  it("pre-selects the saved research mode", async () => {
    store({ defaultMode: "BREAKTHROUGH_DISCOVERY" });
    mount();

    await waitFor(() => expect(modeRadio("BREAKTHROUGH_DISCOVERY")?.checked).toBe(true));
    expect(modeRadio("STANDARD")?.checked).toBe(false);
  });

  it("applies the saved report language and literature scope", async () => {
    store({ defaultReportLanguage: "bilingual", defaultLiteratureScope: false });
    mount();

    await waitFor(() => {
      const select = document.querySelector<HTMLSelectElement>(".request-direct-fields select");
      expect(select?.value).toBe("bilingual");
    });
    const scope = document.querySelector<HTMLInputElement>(".literature-scope-toggle input");
    expect(scope?.checked).toBe(false);
  });

  it("falls back to the shipped defaults when nothing is stored", async () => {
    mount();

    await waitFor(() => expect(modeRadio("STANDARD")?.checked).toBe(true));
    const scope = document.querySelector<HTMLInputElement>(".literature-scope-toggle input");
    expect(scope?.checked).toBe(true);
  });

  it("never overwrites a draft started before the preferences arrived", async () => {
    // Preferences are read from localStorage inside a timer, so on a slow device
    // a fast typist can begin before they land. Holding the timer reproduces that
    // window exactly; without the guard the seed would discard the draft.
    store({ defaultMode: "BREAKTHROUGH_DISCOVERY" });
    mount();

    // No await yet, so the provider's pending timer cannot have run: this is
    // exactly the window in which a fast typist starts. fireEvent is used
    // instead of userEvent because it is synchronous and will not yield.
    const field = screen.getByLabelText("연구 목표") as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: "편집 효율 정체" } });
    fireEvent.click(screen.getByRole("radio", { name: /표준 연구/ }));

    // Now let the preferences land.
    await waitFor(() => expect(modeRadio("STANDARD")).toBeTruthy());
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(field.value).toBe("편집 효율 정체");
    expect(modeRadio("STANDARD")?.checked).toBe(true);
    expect(modeRadio("BREAKTHROUGH_DISCOVERY")?.checked).toBe(false);
  });
});
