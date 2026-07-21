import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const expected = process.argv.slice(2).find((value) => value !== "--") ?? "/scientific-core-research-portal";
const htmlPath = join(process.cwd(), "out", "runs", "index.html");

if (!expected.startsWith("/") || expected.endsWith("/")) {
  throw new Error(`Expected a project-site base path such as /repository-name, received: ${expected}`);
}
if (!existsSync(htmlPath)) throw new Error("Static Runs page is missing");

const html = readFileSync(htmlPath, "utf8");
const required = [`${expected}/_next/`, `${expected}/new-run/`, `${expected}/runs/`];
for (const value of required) {
  if (!html.includes(value)) throw new Error(`Project-site export is missing basePath reference: ${value}`);
}
if (/\b(?:href|src)=["']\/_next\//.test(html)) {
  throw new Error("Project-site export contains a root-relative Next.js asset");
}

console.log(`Project-site basePath export PASS: ${expected}`);
