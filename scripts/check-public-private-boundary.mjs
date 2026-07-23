import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const requestedOut = process.argv.find((value) => value.startsWith("--out="))?.slice(6) ?? "out";
const output = join(root, requestedOut);
const markerArgument = process.argv.find((value) => value.startsWith("--markers="))?.slice(10)
  ?? ".private-review-artifacts/portal-v3-boundary-fix/private-boundary-markers.json";
const markerPath = resolve(root, markerArgument);
const markerGroups = existsSync(markerPath) ? JSON.parse(readFileSync(markerPath, "utf8")) : {};
const forbidden = [...new Set([
  ...(markerGroups.run_ids ?? []),
  ...(markerGroups.report_ids ?? []),
  ...(markerGroups.idea_ids ?? []),
  ...(markerGroups.source_ids ?? []),
  ...(markerGroups.artifact_names ?? []),
].filter((value) => typeof value === "string" && value.length > 0))];
const failures = [];

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}

if (!existsSync(output)) failures.push("out/ is missing");
if (existsSync(join(output, "local-artifacts"))) failures.push("out/local-artifacts exists");
for (const file of filesUnder(output)) {
  if (statSync(file).size > 8_000_000) continue;
  const value = readFileSync(file).toString("utf8");
  for (const marker of forbidden) if (value.includes(marker)) failures.push(`${relative(root, file)} contains ${marker}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("PUBLIC_EXPORT_PRIVATE_CONTENT_CHECK=PASS");
