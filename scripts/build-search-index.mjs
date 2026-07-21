import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "content", "runs");
const index = JSON.parse(readFileSync(join(root, "index.json"), "utf8"));
const records = [];
for (const slug of index.runs) {
  const runRoot = join(root, slug);
  const run = JSON.parse(readFileSync(join(runRoot, "run.json"), "utf8"));
  records.push({ type: "run", id: run.run_id, run_slug: slug, slug, title: run.title, summary: run.summary, text: [run.subtitle, run.research_domain, ...run.tags].join(" "), href: `/runs/${slug}/` });
  for (const ideaSlug of run.idea_refs) {
    const idea = JSON.parse(readFileSync(join(runRoot, "ideas", `${ideaSlug}.json`), "utf8"));
    records.push({ type: "idea", id: idea.idea_id, run_slug: slug, slug: idea.slug, title: idea.title, summary: idea.abstract, text: [idea.category, idea.recommendation, ...idea.tags].join(" "), href: `/runs/${slug}/ideas/${idea.slug}/` });
  }
  for (const folder of ["knowledge", "reports"]) {
    const folderPath = join(runRoot, folder);
    for (const name of readdirSync(folderPath).filter((item) => item.endsWith(".md"))) {
      const markdown = readFileSync(join(folderPath, name), "utf8");
      const headings = markdown.split("\n").filter((line) => /^#{1,3} /.test(line)).map((line) => line.replace(/^#+ /, ""));
      records.push({ type: folder === "knowledge" ? "knowledge" : "report", id: `${slug}:${name}`, run_slug: slug, slug: name.replace(/\.md$/, ""), title: headings[0] ?? name, summary: headings.slice(1, 4).join(" / "), text: headings.join(" "), href: `/runs/${slug}/${folder === "knowledge" ? "knowledge" : "reports"}/` });
    }
  }
}
mkdirSync(join(process.cwd(), "public"), { recursive: true });
writeFileSync(join(process.cwd(), "public", "search-index.json"), JSON.stringify({ schema_version: "SearchIndexV1", generated_at: new Date(0).toISOString(), records }, null, 2) + "\n");
console.log(`Search index built: ${records.length} records.`);
