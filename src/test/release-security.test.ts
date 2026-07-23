import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const node = process.execPath;
const objectAuditor = resolve(root, "scripts", "audit-reachable-git-objects.mjs");
const pythonLauncher = resolve(root, "scripts", "run-python.mjs");

function git(repo: string, args: string[]) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
}

function write(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function fixtureRepository() {
  const parent = mkdtempSync(join(tmpdir(), "portal-release-security-"));
  const repo = join(parent, "repo");
  mkdirSync(repo);
  git(repo, ["init"]);
  git(repo, ["config", "user.email", "synthetic@example.invalid"]);
  git(repo, ["config", "user.name", "Synthetic Test"]);
  write(join(repo, "base.txt"), "public baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "public baseline"]);
  const base = git(repo, ["rev-parse", "HEAD"]);
  const markers = join(parent, "markers.json");
  write(markers, JSON.stringify({
    private_paths: ["private-zone/record.json"],
    private_path_tokens: ["private-zone/"],
    record_markers: ["SYNTHETIC_INTERNAL_RECORD_9"],
    source_markers: ["SYNTHETIC_INTERNAL_RECORD_9"],
    private_screenshot_sha256: [],
  }));
  return { parent, repo, base, markers };
}

describe("release security controls", () => {
  it("keeps private build roots ignored without hiding normal source paths", () => {
    const privatePath = spawnSync("git", ["check-ignore", "--no-index", ".local-preview/synthetic-run/run.json"], { cwd: root });
    expect(privatePath.status).toBe(0);
    for (const safePath of [
      "src/future-module.ts",
      "scripts/future-tool.mjs",
      "tests/future-test.py",
      "content/runs/future-public/run.json",
    ]) {
      const result = spawnSync("git", ["check-ignore", "--no-index", safePath], { cwd: root });
      expect(result.status, safePath).toBe(1);
    }
  });

  it("accepts generic LAB_INTERNAL policy syntax without an actual private record", () => {
    const { parent, repo, base, markers } = fixtureRepository();
    write(join(repo, "policy.json"), '{"allowed_enum":"LAB_INTERNAL"}\n');
    git(repo, ["add", "."]);
    git(repo, ["commit", "-m", "add generic boundary policy"]);
    const output = join(parent, "pass.json");
    const result = spawnSync(node, [objectAuditor, `--base=${base}`, "--head=HEAD", `--markers=${markers}`, `--output=${output}`], { cwd: repo });
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(output, "utf8")).decision).toBe("PASS");
  });

  it("rejects a newly reachable synthetic private path and record", () => {
    const { parent, repo, base, markers } = fixtureRepository();
    write(join(repo, "private-zone", "record.json"), '{"id":"SYNTHETIC_INTERNAL_RECORD_9"}\n');
    git(repo, ["add", "."]);
    git(repo, ["commit", "-m", "inject synthetic private record"]);
    const output = join(parent, "fail.json");
    const result = spawnSync(node, [objectAuditor, `--base=${base}`, "--head=HEAD", `--markers=${markers}`, `--output=${output}`], { cwd: repo });
    const audit = JSON.parse(readFileSync(output, "utf8"));
    expect(result.status).toBe(1);
    expect(audit.reachable_private_paths).toBeGreaterThan(0);
    expect(audit.reachable_private_records).toBeGreaterThan(0);
  });

  it("fails clearly when the explicitly selected Python executable is unusable", () => {
    const missing = resolve(tmpdir(), "scientific-core-python-does-not-exist");
    const result = spawnSync(node, [pythonLauncher, "--check-only"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, SCIENTIFIC_CORE_PYTHON: missing },
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("SCIENTIFIC_CORE_PYTHON is not a usable Python executable");
  });
});
