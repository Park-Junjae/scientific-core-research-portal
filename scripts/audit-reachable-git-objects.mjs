import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const argument = (name, fallback) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const base = argument("base", "origin/main");
const head = argument("head", "HEAD");
const markerArgument = argument("markers", "");
const output = resolve(root, argument("output", ".publication-staging/reachable-object-audit.json"));

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function git(args, encoding = null) {
  return execFileSync("git", args, { cwd: root, encoding, maxBuffer: 256 * 1024 * 1024 });
}

function normalize(value) {
  return value.replaceAll("\\", "/");
}

const markers = markerArgument && existsSync(resolve(root, markerArgument))
  ? readJson(resolve(root, markerArgument))
  : {};
const privatePaths = new Set((markers.private_paths ?? []).map(normalize));
const privatePathTokens = (markers.private_path_tokens ?? []).map((value) => normalize(value).toLowerCase());
const recordMarkers = [...new Set(markers.record_markers ?? [])];
const sourceMarkers = new Set(markers.source_markers ?? []);
const screenshotHashes = new Set(markers.private_screenshot_sha256 ?? []);
const policyContentPaths = new Set([
  ".gitignore",
  "eslint.config.mjs",
  "scripts/audit-citation-resolution.mjs",
  "scripts/audit-tracked-publication-boundary.mjs",
  "scripts/build-private-boundary-markers.mjs",
  "scripts/check-public-private-boundary.mjs",
  "scripts/stage-local-preview.mjs",
  "src/test/release-security.test.ts",
]);
const absolutePathPattern = /(?:[A-Za-z]:[\\/](?:Users|Documents|Downloads|workspace)[\\/]|\/(?:home|Users)\/[^\s/]+\/(?:workspace|Documents|Downloads)\/)/g;

const objectLines = git(["rev-list", "--objects", `${base}..${head}`], "utf8").split(/\r?\n/).filter(Boolean);
const privatePathFindings = new Set();
const privateRecordFindings = new Set();
const absolutePathFindings = new Set();
const privateScreenshotFindings = new Set();
const actualInternalSourceFindings = new Set();

for (const line of objectLines) {
  const space = line.indexOf(" ");
  if (space < 0) continue;
  const oid = line.slice(0, space);
  const path = normalize(line.slice(space + 1));
  const lowerPath = path.toLowerCase();
  if (privatePaths.has(path) || privatePathTokens.some((token) => lowerPath.includes(token))) {
    privatePathFindings.add(path);
  }
  if (git(["cat-file", "-t", oid], "utf8").trim() !== "blob") continue;
  const content = git(["cat-file", "blob", oid]);
  const hash = createHash("sha256").update(content).digest("hex");
  if (screenshotHashes.has(hash)) privateScreenshotFindings.add(path);
  if (content.includes(0) || content.length > 10_000_000) continue;
  const text = content.toString("utf8");
  const lowerText = text.toLowerCase();
  for (const marker of recordMarkers) {
    if (lowerText.includes(String(marker).toLowerCase())) privateRecordFindings.add(`${path}:${marker}`);
  }
  for (const marker of sourceMarkers) {
    if (lowerText.includes(String(marker).toLowerCase())) actualInternalSourceFindings.add(`${path}:${marker}`);
  }
  for (const match of text.matchAll(absolutePathPattern)) absolutePathFindings.add(`${path}:${match[0]}`);
  if (!policyContentPaths.has(path)) {
    for (const privatePath of privatePaths) {
      if (lowerText.includes(privatePath.toLowerCase())) privatePathFindings.add(`${path}:${privatePath}`);
    }
    for (const token of privatePathTokens) {
      if (lowerText.includes(token)) privatePathFindings.add(`${path}:${token}`);
    }
  }
}

for (const commit of git(["rev-list", `${base}..${head}`], "utf8").split(/\r?\n/).filter(Boolean)) {
  const text = git(["cat-file", "commit", commit], "utf8");
  for (const marker of recordMarkers) {
    if (text.toLowerCase().includes(String(marker).toLowerCase())) privateRecordFindings.add(`commit:${commit}:${marker}`);
  }
  for (const match of text.matchAll(absolutePathPattern)) absolutePathFindings.add(`commit:${commit}:${match[0]}`);
}

const result = {
  schema_version: "SanitizedGitObjectAuditV1",
  base,
  head,
  marker_file_loaded: Boolean(markerArgument && existsSync(resolve(root, markerArgument))),
  reachable_object_count: objectLines.length,
  reachable_private_paths: privatePathFindings.size,
  reachable_private_records: privateRecordFindings.size,
  reachable_absolute_paths: absolutePathFindings.size,
  reachable_private_screenshots: privateScreenshotFindings.size,
  reachable_actual_internal_sources: actualInternalSourceFindings.size,
  findings: {
    private_paths: [...privatePathFindings],
    private_records: [...privateRecordFindings],
    absolute_paths: [...absolutePathFindings],
    private_screenshots: [...privateScreenshotFindings],
    actual_internal_sources: [...actualInternalSourceFindings],
  },
};
result.decision = Object.entries(result)
  .filter(([key]) => key.startsWith("reachable_") && key !== "reachable_object_count")
  .every(([, value]) => value === 0) ? "PASS" : "FAIL";

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (result.decision !== "PASS") process.exitCode = 1;
