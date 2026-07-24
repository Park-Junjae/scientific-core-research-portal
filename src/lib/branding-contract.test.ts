import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const visibleFiles = [
  "src/app/layout.tsx",
  "src/app/about/page.tsx",
  "src/components/site-navigation.tsx",
  "content/runs/prame-logic-first-demo/run.json",
  "content/runs/taled-historical-demo/run.json",
  "content/runs/xrrna-prime-assembly-demo/run.json",
];

describe("public product branding", () => {
  it("uses the exact external brand and Korean document default", () => {
    const source = visibleFiles
      .map((path) => readFileSync(resolve(root, path), "utf8"))
      .join("\n");
    expect(source).toContain("AI Cho-Scientist");
    expect(source).toContain('<html lang="ko"');
    expect(source).not.toMatch(
      /Scientific Core|Beyond AI Co-Scientist|AI Cho Scientist|AI Cho-Scienctist/,
    );
  });
});
