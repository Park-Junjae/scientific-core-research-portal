import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = process.cwd();
const localRunsArgument = process.argv.find((value) => value.startsWith("--local-runs="))?.slice(13)
  ?? process.env.SCIENTIFIC_CORE_LOCAL_RUNS;
if (!localRunsArgument) throw new Error("Provide --local-runs or SCIENTIFIC_CORE_LOCAL_RUNS");
const localRuns = resolve(root, localRunsArgument);
const outputArgument = process.argv.find((value) => value.startsWith("--output="));
const output = resolve(root, outputArgument?.slice(9) ?? ".private-review-artifacts/portal-v3-boundary-fix/private-boundary-markers.json");

const unique = (values) => [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))].sort();
const runIds = [];
const reportIds = [];
const ideaIds = [];
const sourceIds = [];
const artifactNames = [];

if (existsSync(localRuns)) {
  for (const entry of readdirSync(localRuns, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const runRoot = join(localRuns, entry.name);
    const runPath = join(runRoot, "run.json");
    if (!existsSync(runPath)) continue;
    const run = JSON.parse(readFileSync(runPath, "utf8"));
    if (run.visibility === "PUBLIC_SANITIZED") continue;
    runIds.push(run.run_id, run.slug);
    reportIds.push(...(run.reports ?? []).flatMap((report) => [report.report_id, report.translation_group_id]));
    ideaIds.push(...(run.idea_refs ?? []));
    artifactNames.push(...(run.reports ?? []).flatMap((report) => [report.path, report.markdown_path]));

    const sourcePath = join(runRoot, "literature", "index.json");
    if (existsSync(sourcePath)) {
      const sourceIndex = JSON.parse(readFileSync(sourcePath, "utf8"));
      sourceIds.push(...(sourceIndex.sources ?? []).map((source) => source.source_id));
      reportIds.push(...(sourceIndex.sources ?? []).flatMap((source) => source.related_report_ids ?? []));
      ideaIds.push(...(sourceIndex.sources ?? []).flatMap((source) => source.related_idea_ids ?? []));
    }
  }
}

const payload = {
  schema_version: "PrivateBoundaryMarkersV1",
  source: relative(root, localRuns).replaceAll("\\", "/"),
  run_ids: unique(runIds),
  report_ids: unique(reportIds),
  idea_ids: unique(ideaIds),
  source_ids: unique(sourceIds),
  artifact_names: unique(artifactNames.map((value) => value?.split(/[\\/]/).at(-1))),
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`PRIVATE_BOUNDARY_MARKERS=${relative(root, output).replaceAll("\\", "/")}`);
console.log(`PRIVATE_SOURCE_IDS=${payload.source_ids.length}`);
