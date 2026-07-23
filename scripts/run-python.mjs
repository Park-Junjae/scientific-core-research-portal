import { existsSync } from "node:fs";
import { delimiter, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const requestedArgs = process.argv.slice(2);
const checkOnly = requestedArgs[0] === "--check-only";
const commandArgs = checkOnly ? requestedArgs.slice(1) : requestedArgs;
const runsTests = checkOnly || commandArgs.some((argument, index) =>
  argument === "pytest"
  || argument.endsWith("tests/run_all.py")
  || (argument === "-m" && commandArgs[index + 1] === "pytest")
);
const requiredPackages = runsTests ? ["jsonschema", "pytest"] : ["jsonschema"];

function executableCandidates() {
  const explicit = process.env.SCIENTIFIC_CORE_PYTHON?.trim();
  if (explicit) return [{ command: explicit, explicit: true }];

  const local = process.platform === "win32"
    ? [resolve(".venv", "Scripts", "python.exe"), resolve(".venv", "bin", "python")]
    : [resolve(".venv", "bin", "python"), resolve(".venv", "Scripts", "python.exe")];
  return [
    ...local.filter((command) => existsSync(command)).map((command) => ({ command, explicit: false })),
    { command: "python3", explicit: false },
    { command: "python", explicit: false },
  ];
}

function probe(command) {
  return spawnSync(command, ["-c", "import sys; print(sys.executable)"], {
    encoding: "utf8",
    env: { ...process.env, PATH: process.env.PATH?.split(delimiter).join(delimiter) },
  });
}

let selected;
for (const candidate of executableCandidates()) {
  const result = probe(candidate.command);
  if (result.status === 0) {
    selected = { ...candidate, executable: result.stdout.trim() || candidate.command };
    break;
  }
  if (candidate.explicit) {
    console.error(`SCIENTIFIC_CORE_PYTHON is not a usable Python executable: ${candidate.command}`);
    process.exit(2);
  }
}

if (!selected) {
  console.error("No usable Python interpreter found. Set SCIENTIFIC_CORE_PYTHON or create .venv.");
  process.exit(2);
}

const missing = requiredPackages.filter((packageName) => {
  const result = spawnSync(selected.command, ["-c", `import ${packageName}`], { encoding: "utf8" });
  return result.status !== 0;
});

console.log(`Scientific Core Python: ${selected.executable}`);
if (missing.length > 0) {
  console.error(`Missing required Python packages: ${missing.join(", ")}`);
  console.error(`Install with: "${selected.executable}" -m pip install -e . pytest`);
  process.exit(3);
}

if (checkOnly) process.exit(0);
if (commandArgs.length === 0) {
  console.error("No Python command arguments were provided.");
  process.exit(2);
}

const result = spawnSync(selected.command, commandArgs, { stdio: "inherit" });
if (result.error) {
  console.error(result.error.message);
  process.exit(2);
}
process.exit(result.status ?? 2);
