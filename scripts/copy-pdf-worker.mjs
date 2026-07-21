import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const source = join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const target = join(process.cwd(), "public", "pdf.worker.min.mjs");
if (!existsSync(source)) throw new Error(`PDF.js worker missing: ${source}`);
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log("PDF.js worker copied.");
