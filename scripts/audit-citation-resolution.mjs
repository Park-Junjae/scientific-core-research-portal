import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const roots = [join(process.cwd(), "content", "runs")];
const localRoot = join(process.cwd(), ".local-preview", "content", "runs");
if (existsSync(localRoot)) roots.push(localRoot);

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }

function expand(value) {
  return value.split(/\s*,\s*/).flatMap((part) => {
    const bounds = part.split(/\s*[-–]\s*/).map(Number);
    if (bounds.length !== 2) return bounds;
    const [start, end] = bounds;
    return Array.from({ length: Math.abs(end - start) + 1 }, (_, index) => Math.min(start, end) + index);
  });
}

function runDirectories(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, "run.json")))
    .map((entry) => join(root, entry.name));
}

const reports = [];
const unresolved = [];
for (const root of roots) for (const runDirectory of runDirectories(root)) {
  const run = readJson(join(runDirectory, "run.json"));
  const literaturePath = join(runDirectory, "literature", "index.json");
  const sources = existsSync(literaturePath) ? readJson(literaturePath).sources : [];
  for (const report of run.reports.filter((item) => item.report_status === "APPROVED" && item.markdown_path)) {
    const markdownPath = join(runDirectory, report.markdown_path);
    if (!existsSync(markdownPath)) continue;
    const sourceByNumber = new Map();
    for (const source of sources) for (const citation of source.cited_in_reports ?? []) {
      if (citation.report_id !== report.report_id) continue;
      for (const number of citation.citation_numbers) sourceByNumber.set(number, source.source_id);
    }
    const markdown = readFileSync(markdownPath, "utf8");
    const citedNumbers = Array.from(markdown.matchAll(/\[(\d+(?:\s*(?:[-–,])\s*\d+)*)\]/g)).flatMap((match) => expand(match[1]));
    const uniqueNumbers = [...new Set(citedNumbers)].sort((a, b) => a - b);
    const missing = uniqueNumbers.filter((number) => !sourceByNumber.has(number));
    for (const number of missing) unresolved.push({ run_id: run.run_id, report_id: report.report_id, citation_number: number });
    reports.push({
      run_id: run.run_id,
      run_slug: run.slug,
      report_id: report.report_id,
      approved: true,
      namespace: "report_id + citation_number",
      citation_numbers: uniqueNumbers,
      resolved_count: uniqueNumbers.length - missing.length,
      unresolved_numbers: missing,
      resolved_source_ids: uniqueNumbers.filter((number) => sourceByNumber.has(number)).map((number) => sourceByNumber.get(number)),
    });
  }
}

const output = {
  generated_at: new Date().toISOString(),
  status: unresolved.length === 0 ? "PASS" : "FAIL",
  namespace: "report_id + citation_number",
  supported_patterns: ["[1]", "[1,2]", "[1–2]", "[1-3]", "[2,4–6]"],
  approved_report_count: reports.length,
  unresolved_count: unresolved.length,
  unresolved,
  reports,
};
writeFileSync(join(process.cwd(), "FINAL_CITATION_NAMESPACE_AUDIT.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`CITATION_RESOLUTION=${output.status} reports=${reports.length} unresolved=${unresolved.length}`);
if (unresolved.length) process.exit(1);
