import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const productionApiBase = "https://api.aichoscientist.com";
const configuredApiBase = (
  process.env.NEXT_PUBLIC_RUN_CONTROL_API_BASE ?? ""
).replace(/\/+$/, "");
const output = join(process.cwd(), "out");
const failures = [];

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}

if (configuredApiBase !== productionApiBase) {
  failures.push(
    `NEXT_PUBLIC_RUN_CONTROL_API_BASE must equal ${productionApiBase} for the production build`,
  );
}
if (!existsSync(output)) failures.push("out/ is missing");

let embedded = false;
const forbidden = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["OpenAI-style secret", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/],
  ["JWT value", /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/],
  ["Cloudflare Access assertion", /Cf-Access-Jwt-Assertion\s*[:=]\s*["'][^"']+/i],
  ["Cloudflare authorization cookie", /CF_Authorization\s*=\s*[^;\s"']+/i],
  ["Bearer credential", /Authorization\s*[:=]\s*["']Bearer\s+[^"']+/i],
];

for (const file of filesUnder(output)) {
  if (statSync(file).size > 10_000_000) continue;
  const value = readFileSync(file, "utf8");
  if (value.includes(productionApiBase)) embedded = true;
  for (const [label, pattern] of forbidden) {
    if (pattern.test(value)) {
      failures.push(`${relative(process.cwd(), file)} contains a ${label}`);
    }
  }
}

if (!embedded) {
  failures.push("production API base is not embedded in the static output");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`PRODUCTION_RUN_CONTROL_API_BASE=${productionApiBase}`);
console.log("STATIC_CREDENTIAL_SCAN=PASS");
