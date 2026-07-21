import { readFileSync } from "node:fs";

const value = JSON.parse(readFileSync("deploy/site_visibility.json", "utf8"));
const deployable = value.mode === "PUBLIC_SANITIZED" && value.public_release_approved === true && Array.isArray(value.approved_run_ids) && value.approved_run_ids.length > 0;
if (process.argv.includes("--github-output")) {
  process.stdout.write(`deployable=${deployable}\nmode=${value.mode}\n`);
} else {
  console.log(JSON.stringify({ deployable, ...value }, null, 2));
}
if (process.argv.includes("--require-public") && !deployable) process.exit(3);
