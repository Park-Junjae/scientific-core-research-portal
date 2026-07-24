import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const argument = process.argv.slice(2).find((value) => value !== "--");
const expected = argument === "--root" ? "" : (argument ?? "/scientific-core-research-portal");
const htmlPath = join(process.cwd(), "out", "runs", "index.html");
const nextRoot = join(process.cwd(), "out", "_next");

if (expected !== "" && (!expected.startsWith("/") || expected.endsWith("/"))) {
  throw new Error(`Expected an empty custom-domain base path or /repository-name, received: ${expected}`);
}
if (!existsSync(htmlPath)) throw new Error("Static Runs page is missing");
if (!existsSync(nextRoot)) throw new Error("Static Next.js asset directory is missing: out/_next");

const html = readFileSync(htmlPath, "utf8");
const required = expected === ""
  ? ["/_next/", "/new-run/", "/runs/"]
  : [`${expected}/_next/`, `${expected}/new-run/`, `${expected}/runs/`];
for (const value of required) {
  if (!html.includes(value)) throw new Error(`Static export is missing expected reference: ${value}`);
}
if (expected !== "" && /\b(?:href|src)=["']\/_next\//.test(html)) {
  throw new Error("Project-site export contains a root-relative Next.js asset");
}
if (expected === "") {
  if (html.includes("/scientific-core-research-portal/")) {
    throw new Error("Custom-domain export contains the legacy project-site base path");
  }
  if (/["']\/\/(?:_next|runs|new-run)\//.test(html)) {
    throw new Error("Custom-domain export contains a duplicated slash");
  }
  const cname = join(process.cwd(), "out", "CNAME");
  if (!existsSync(cname) || readFileSync(cname, "utf8").trim() !== "app.aichoscientist.com") {
    throw new Error("Custom-domain export is missing the expected CNAME");
  }
}

function filesUnder(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(path));
    else files.push(path);
  }
  return files;
}

const assetFiles = filesUnder(nextRoot);
if (!assetFiles.some((path) => path.endsWith(".css"))) {
  throw new Error("Custom export has no generated CSS under out/_next");
}
if (!assetFiles.some((path) => path.endsWith(".js"))) {
  throw new Error("Custom export has no generated JavaScript under out/_next");
}

console.log(`${expected === "" ? "Custom-domain root" : "Project-site"} export PASS: ${expected || "/"}`);
