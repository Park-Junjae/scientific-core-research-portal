import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";

const publicRoot = join(process.cwd(), "public", "local-artifacts");
rmSync(publicRoot, { recursive: true, force: true });

if (process.env.SCIENTIFIC_CORE_INCLUDE_LOCAL_PREVIEW !== "1") {
  console.log("Local preview staging disabled; public build contains no LAB_INTERNAL artifacts.");
  process.exit(0);
}

const runsRoot = join(process.cwd(), ".local-preview", "content", "runs");
if (!existsSync(runsRoot)) throw new Error("Local preview requested but .local-preview/content/runs is missing");
for (const run of readdirSync(runsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
  const reports = join(runsRoot, run.name, "reports");
  if (!existsSync(reports)) continue;
  const target = join(publicRoot, run.name);
  mkdirSync(target, { recursive: true });
  for (const name of readdirSync(reports).filter((file) => file.toLowerCase().endsWith(".pdf"))) cpSync(join(reports, name), join(target, basename(name)));
}
console.log("LAB_INTERNAL PDF variants staged for this local build only.");
