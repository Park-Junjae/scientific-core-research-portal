import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const out = join(process.cwd(), "out");
let total = 0;
const pdfWarnings = [];
function walk(dir) { for (const item of readdirSync(dir, { withFileTypes: true })) { const full = join(dir, item.name); if (item.isDirectory()) walk(full); else { const size = statSync(full).size; total += size; if (item.name.toLowerCase().endsWith(".pdf") && size > 25 * 1024 * 1024) pdfWarnings.push({ path: relative(out, full).replaceAll("\\", "/"), size_bytes: size }); } } }
if (!existsSync(out)) throw new Error("Static export directory is missing");
walk(out);
const report = { generated_at: new Date().toISOString(), site_size_bytes: total, warn_threshold_bytes: 750 * 1024 * 1024, block_threshold_bytes: 900 * 1024 * 1024, status: total > 900 * 1024 * 1024 ? "BLOCK" : total > 750 * 1024 * 1024 ? "WARN" : "PASS", pdf_warnings: pdfWarnings };
writeFileSync(join(process.cwd(), "STATIC_ASSET_BUDGET_REPORT.json"), JSON.stringify(report, null, 2) + "\n");
if (report.status === "BLOCK") throw new Error(`Static site exceeds 900 MB: ${total}`);
console.log(`Asset budget ${report.status}: ${(total / 1024 / 1024).toFixed(2)} MB.`);
