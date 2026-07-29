import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const argument = (name, fallback) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const markerPath = resolve(root, argument("markers", ".private-review-artifacts/portal-v3-boundary-fix/private-boundary-markers.json"));
const publicOut = resolve(root, argument("public-out", "out"));
const output = resolve(root, argument("output", ".publication-staging/tracked-tree-publication-boundary-audit.json"));

const privatePathPatterns = [
  /(^|\/)(\.local-preview|out-local(?:-[^/]*)?|out-review(?:-[^/]*)?|local-artifacts)(\/|$)/,
  /(^|\/)(FINAL_SCREENSHOTS|BEFORE_AFTER_SCREENSHOTS|test-results\/screenshots)(\/|$)/,
  /^UPDATED_SCREENSHOTS\/(runs|literature)-.*\.png$/,
  /(^|\/)(RUN_SCOPED_SOURCE_LEDGER|SOURCE_RECONCILIATION|LOCAL_PREVIEW_IMPORT|FINAL_CITATION_NAMESPACE_AUDIT)/,
  /^scripts\/(finalize-v3-review\.mjs|import-prime-assembly-source-atlas\.py)$/,
  /^tests\/e2e\/(final-acceptance|portal|runs-literature-visual)\.spec\.ts$/,
  /^tests\/test_prime_assembly_reconciliation\.py$/,
];
const absoluteWindowsPath = /(?:^|[\s"'`(])(?:[A-Za-z]:[\\/](?:Users|Documents|Downloads|workspace)[\\/][^\s"'`)]*)/g;
const textExtensions = new Set(["", ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".py", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}

function readText(file) {
  if (!existsSync(file)) return null;
  if (!textExtensions.has(extname(file).toLowerCase()) || statSync(file).size > 8_000_000) return null;
  try { return readFileSync(file, "utf8"); } catch { return null; }
}

const markers = existsSync(markerPath)
  ? JSON.parse(readFileSync(markerPath, "utf8"))
  : { run_ids: [], report_ids: [], idea_ids: [], source_ids: [], artifact_names: [] };
const allMarkers = [...new Set([
  ...(markers.run_ids ?? []),
  ...(markers.report_ids ?? []),
  ...(markers.idea_ids ?? []),
  ...(markers.source_ids ?? []),
  ...(markers.artifact_names ?? []),
].filter(Boolean))];
const sourceIds = new Set(markers.source_ids ?? []);
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root }).toString().split("\0").filter(Boolean);
const trackedInternalFiles = new Set();
const trackedInternalRecords = new Set();
let trackedAbsolutePathCount = 0;

for (const trackedPath of tracked) {
  const normalized = trackedPath.replaceAll("\\", "/");
  if (privatePathPatterns.some((pattern) => pattern.test(normalized))) trackedInternalFiles.add(normalized);
  const text = readText(join(root, trackedPath));
  if (text === null) continue;
  const absoluteMatches = text.match(absoluteWindowsPath) ?? [];
  trackedAbsolutePathCount += absoluteMatches.length;
  for (const marker of allMarkers) if (text.includes(marker)) trackedInternalFiles.add(normalized);
  for (const sourceId of sourceIds) if (text.includes(sourceId)) trackedInternalRecords.add(sourceId);
}

const ignoredRoots = [
  ".private-review-artifacts",
  ".local-preview",
  "out-local",
  "out-local-v3",
  "out-local-v3-final",
  "out-review-v3-final",
  "FINAL_SCREENSHOTS",
  "BEFORE_AFTER_SCREENSHOTS",
  "test-results/screenshots",
];
let ignoredInternalFileCount = ignoredRoots.reduce((count, path) => count + filesUnder(join(root, path)).length, 0);
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (privatePathPatterns.some((pattern) => pattern.test(entry.name))) ignoredInternalFileCount += 1;
}
const updatedScreenshots = join(root, "UPDATED_SCREENSHOTS");
ignoredInternalFileCount += filesUnder(updatedScreenshots).filter((file) => privatePathPatterns.some((pattern) => pattern.test(relative(root, file).replaceAll("\\", "/")))).length;

const publicInternalRecords = new Set();
for (const file of filesUnder(publicOut)) {
  const text = readText(file);
  if (text === null) continue;
  for (const sourceId of sourceIds) if (text.includes(sourceId)) publicInternalRecords.add(sourceId);
}

const result = {
  schema_version: "TrackedTreePublicationBoundaryAuditV1",
  marker_file_loaded: existsSync(markerPath),
  tracked_internal_file_count: trackedInternalFiles.size,
  tracked_internal_record_count: trackedInternalRecords.size,
  tracked_absolute_path_count: trackedAbsolutePathCount,
  ignored_internal_file_count: ignoredInternalFileCount,
  public_build_internal_record_count: publicInternalRecords.size,
  decision: trackedInternalFiles.size === 0 && trackedInternalRecords.size === 0 && trackedAbsolutePathCount === 0 && publicInternalRecords.size === 0 ? "PASS" : "FAIL",
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (result.decision !== "PASS") process.exitCode = 1;
