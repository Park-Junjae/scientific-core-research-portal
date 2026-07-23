import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const requestedOut = process.argv.find((value) => value.startsWith("--out="))?.slice(6) ?? "out";
const out = join(process.cwd(), requestedOut);
if (!existsSync(join(out, "index.html"))) throw new Error("Static export missing index.html");
const html = [];
function walk(dir) { for (const name of readdirSync(dir, { withFileTypes: true })) { const full = join(dir, name.name); if (name.isDirectory()) walk(full); else if (name.name.endsWith(".html")) html.push(full); } }
walk(out);
const required = ["runs/index.html", "new-run/index.html", "settings/index.html", "about/index.html", "404.html"];
for (const file of required) if (!existsSync(join(out, file))) throw new Error(`Required static route missing: ${file}`);
for (const file of html) {
  const source = readFileSync(file, "utf8");
  if (/href=["'](?:file:|[A-Za-z]:\\|\/home\/)/i.test(source)) throw new Error(`Local path leaked in ${file}`);
}
console.log(`Static route/link scan passed for ${html.length} HTML files.`);
