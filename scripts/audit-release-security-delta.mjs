import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const argument = (name) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const safeManifestPath = argument("safe-manifest");
const deltaManifestPath = argument("delta-manifest");
const markerPath = argument("markers");
const head = argument("head") ?? "HEAD";
const output = resolve(root, argument("output") ?? ".publication-staging/corrected-tree-equivalence-audit.json");
if (!safeManifestPath || !deltaManifestPath) throw new Error("--safe-manifest and --delta-manifest are required");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function git(args, encoding = null) {
  return execFileSync("git", args, { cwd: root, encoding, maxBuffer: 256 * 1024 * 1024 });
}

function treeManifest(ref) {
  const raw = git(["ls-tree", "-rz", "--full-tree", ref]);
  const entries = new Map();
  for (const record of raw.toString("utf8").split("\0").filter(Boolean)) {
    const tab = record.indexOf("\t");
    const [mode, , oid] = record.slice(0, tab).split(" ");
    const path = record.slice(tab + 1);
    const content = git(["cat-file", "blob", oid]);
    entries.set(path, { mode, sha256: createHash("sha256").update(content).digest("hex"), content });
  }
  return entries;
}

const safeManifest = readJson(resolve(root, safeManifestPath));
const deltaManifest = readJson(resolve(root, deltaManifestPath));
const markers = markerPath && existsSync(resolve(root, markerPath)) ? readJson(resolve(root, markerPath)) : {};
const safe = new Map(safeManifest.paths.map((entry) => [entry.path, entry]));
const delta = new Map(deltaManifest.paths.map((entry) => [entry.path, entry]));
const current = treeManifest(head);
const missing = [];
const contentMismatches = [];
const modeMismatches = [];
const unallowlisted = [];
const allowlistedMissing = [];

for (const [path, expected] of safe) {
  const actual = current.get(path);
  if (!actual) {
    if (delta.get(path)?.action !== "DELETE") missing.push(path);
    continue;
  }
  if (delta.get(path)?.action === "MODIFY") continue;
  if (actual.sha256 !== expected.sha256) contentMismatches.push(path);
  if (actual.mode !== expected.mode) modeMismatches.push(path);
}

for (const path of current.keys()) {
  if (!safe.has(path) && delta.get(path)?.action !== "ADD") unallowlisted.push(path);
}

for (const [path, entry] of delta) {
  const actual = current.get(path);
  if ((entry.action === "ADD" || entry.action === "MODIFY") && !actual) allowlistedMissing.push(path);
  if (entry.action === "ADD" && safe.has(path)) unallowlisted.push(`${path}:declared ADD but exists in safe tree`);
  if (entry.action === "MODIFY" && !safe.has(path)) unallowlisted.push(`${path}:declared MODIFY but absent from safe tree`);
  if (entry.action === "DELETE" && actual) unallowlisted.push(`${path}:declared DELETE but remains present`);
}

const recordMarkers = markers.record_markers ?? [];
const privatePathTokens = markers.private_path_tokens ?? [];
const privatePathFindings = new Set();
const privateRecordFindings = new Set();
const absolutePathFindings = new Set();
const policyContentPaths = new Set(["src/test/release-security.test.ts"]);
const absolutePattern = /(?:[A-Za-z]:[\\/](?:Users|Documents|Downloads|workspace)[\\/]|\/(?:home|Users)\/[^\s/]+\/(?:workspace|Documents|Downloads)\/)/g;
for (const path of delta.keys()) {
  const actual = current.get(path);
  if (!actual || actual.content.includes(0)) continue;
  const text = actual.content.toString("utf8");
  const lower = text.toLowerCase();
  for (const marker of recordMarkers) if (lower.includes(String(marker).toLowerCase())) privateRecordFindings.add(`${path}:${marker}`);
  if (!policyContentPaths.has(path)) {
    for (const token of privatePathTokens) if (lower.includes(String(token).toLowerCase())) privatePathFindings.add(`${path}:${token}`);
  }
  for (const match of text.matchAll(absolutePattern)) absolutePathFindings.add(`${path}:${match[0]}`);
}

const result = {
  schema_version: "CorrectedTreeEquivalenceAuditV1",
  safe_product_path_count: safe.size,
  release_security_delta_path_count: delta.size,
  safe_product_paths_missing: missing.length,
  safe_product_content_mismatches: contentMismatches.length,
  safe_product_mode_mismatches: modeMismatches.length,
  unallowlisted_delta_paths: unallowlisted.length,
  allowlisted_paths_missing: allowlistedMissing.length,
  release_security_private_path_findings: privatePathFindings.size,
  release_security_private_record_findings: privateRecordFindings.size,
  release_security_absolute_path_findings: absolutePathFindings.size,
  release_security_scientific_content_findings: privateRecordFindings.size,
  findings: { missing, contentMismatches, modeMismatches, unallowlisted, allowlistedMissing, privatePathFindings: [...privatePathFindings], privateRecordFindings: [...privateRecordFindings], absolutePathFindings: [...absolutePathFindings] },
};
result.decision = Object.entries(result)
  .filter(([key]) => key.endsWith("mismatches") || key.endsWith("findings") || key.endsWith("paths") || key === "safe_product_paths_missing" || key === "allowlisted_paths_missing")
  .filter(([, value]) => typeof value === "number")
  .every(([, value]) => value === 0) ? "PASS" : "FAIL";

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (result.decision !== "PASS") process.exitCode = 1;
