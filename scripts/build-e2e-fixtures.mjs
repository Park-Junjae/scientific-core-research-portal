import { spawnSync } from "node:child_process";

const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(packageManager, ["build"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    SCIENTIFIC_CORE_TEST_ONLY_DEMO_FIXTURES: "1",
    NEXT_PUBLIC_RUN_CONTROL_API_BASE: "https://control.example",
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
