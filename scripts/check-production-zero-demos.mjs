import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const outRoot = join(root, "out");
const historicalSlugs = [
  "xrrna-prime-assembly-demo",
  "prame-logic-first-demo",
  "taled-historical-demo",
];
const searchableExtensions = new Set([".html", ".json", ".txt", ".xml"]);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function walk(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path).flatMap((name) => {
    const child = join(path, name);
    return statSync(child).isDirectory() ? walk(child) : [child];
  });
}

function countSearchRecords(value) {
  if (Array.isArray(value)) return value.length;
  for (const key of ["records", "items", "documents", "runs"]) {
    if (Array.isArray(value?.[key])) return value[key].length;
  }
  return 0;
}

const failures = [];
const runIndexPath = join(root, "content", "runs", "index.json");
const runIndex = readJson(runIndexPath);
const productionRuns = Array.isArray(runIndex) ? runIndex : runIndex.runs;
if (!Array.isArray(productionRuns) || productionRuns.length !== 0) {
  failures.push(`content/runs/index.json contains ${productionRuns?.length ?? "unknown"} run records`);
}

const searchPath = join(root, "public", "search-index.json");
const searchCount = existsSync(searchPath) ? countSearchRecords(readJson(searchPath)) : 0;
if (searchCount !== 0) failures.push(`public/search-index.json contains ${searchCount} records`);

for (const path of walk(outRoot)) {
  const name = relative(outRoot, path).replaceAll("\\", "/");
  const nameLower = name.toLowerCase();
  for (const slug of historicalSlugs) {
    if (nameLower.includes(slug)) failures.push(`historical route or artifact path: ${name}`);
  }
  if (!searchableExtensions.has(extname(path).toLowerCase())) continue;
  const body = readFileSync(path, "utf8").toLowerCase();
  for (const slug of historicalSlugs) {
    if (body.includes(slug)) failures.push(`historical fixture reference in production output: ${name}`);
  }
}

if (failures.length) {
  console.error(JSON.stringify({ production_demo_audit: "failed", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  production_demo_audit: "passed",
  runs: 0,
  search_records: 0,
  artifacts: 0,
  historical_routes: 0,
}, null, 2));
