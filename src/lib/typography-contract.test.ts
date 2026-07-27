import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const css = readFileSync(join(root, "src", "app", "globals.css"), "utf8");
const layout = readFileSync(join(root, "src", "app", "layout.tsx"), "utf8");

describe("Korean-first typography contract", () => {
  it("bundles Pretendard as the primary face with Noto Sans KR behind it", () => {
    expect(layout).toContain('./pretendard.css');
    for (const subset of ["korean", "latin"]) for (const weight of [400, 500, 600, 700]) expect(layout).toContain(`@fontsource/noto-sans-kr/${subset}-${weight}.css`);
    expect(layout).toContain('data-font-family="Pretendard Variable"');
    expect(css).toContain('"Pretendard Variable", "Noto Sans KR"');
    expect(css).toContain('font-synthesis: none');
  });

  it("keeps heading and weight tokens inside the approved range", () => {
    expect(css).toContain("--text-h1: 42px");
    const pixelSizes = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));
    expect(Math.max(...pixelSizes)).toBeLessThanOrEqual(48);
    expect(css).not.toMatch(/font-weight:\s*(?:300|650|750)/);
  });

  it("prevents Korean tab and filter labels from wrapping", () => {
    expect(css).toMatch(/\.run-tabs[^}]*overflow-x:\s*auto/);
    expect(css).toMatch(/\.text-filters button[^}]*white-space:\s*nowrap/);
    expect(css).toMatch(/word-break:\s*keep-all/);
  });
});
