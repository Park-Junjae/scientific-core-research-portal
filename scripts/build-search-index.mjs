import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const roots = [join(process.cwd(), "content", "runs")];
const localRoot = join(process.cwd(), ".local-preview", "content", "runs");
if (process.env.SCIENTIFIC_CORE_INCLUDE_LOCAL_PREVIEW === "1" && existsSync(localRoot)) roots.push(localRoot);
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const records = [];
const seenRunIds = new Set();

for (const root of roots) {
  const indexPath = join(root, "index.json");
  if (!existsSync(indexPath)) continue;
  for (const slug of read(indexPath).runs) {
    const runRoot = join(root, slug);
    const run = read(join(runRoot, "run.json"));
    if (seenRunIds.has(run.run_id)) continue;
    seenRunIds.add(run.run_id);
    const all = (value) => Object.values(value ?? {}).join(" ");
    records.push({ type: "run", id: run.run_id, run_slug: slug, slug, title: run.title, summary: run.summary, text: [all(run.subtitle), all(run.research_question), all(run.research_domain), ...run.tags.map(all), ...run.literature_index.flatMap((paper) => [paper.title, paper.doi ?? "", ...(paper.authors ?? [])])].join(" "), href: `/runs/${slug}/` });
    for (const ideaSlug of run.idea_refs) {
      const idea = read(join(runRoot, "ideas", `${ideaSlug}.json`));
      records.push({ type: "idea", id: idea.idea_id, run_slug: slug, slug: idea.slug, title: idea.title, summary: idea.abstract, text: [all(idea.category), idea.idea_type, idea.lifecycle_status, all(idea.strongest_reason), ...idea.tags.map(all)].join(" "), href: `/runs/${slug}/ideas/${idea.slug}/` });
    }
    for (const report of run.reports) records.push({ type: report.role === "KNOWLEDGE_BACKGROUND" ? "knowledge" : "report", id: report.report_id, run_slug: slug, slug: report.report_id, title: report.localized_title, summary: report.localized_description, text: [report.role, report.language].join(" "), href: `/runs/${slug}/reports/${report.report_id}/` });
    const sourceIndexPath = join(runRoot, "literature", "index.json");
    if (existsSync(sourceIndexPath)) {
      for (const source of read(sourceIndexPath).sources ?? []) {
        records.push({
          type: "source",
          id: source.source_id,
          run_slug: slug,
          slug: source.source_id,
          title: source.localized_title,
          summary: source.localized_relevance,
          text: [source.authors.join(" "), source.journal, source.year, source.doi ?? "", source.pmid ?? "", source.evidence_role, ...source.related_idea_ids, ...source.related_report_ids].join(" "),
          href: `/runs/${slug}/literature/${source.source_id}/`,
        });
      }
    }
  }
}
mkdirSync(join(process.cwd(), "public"), { recursive: true });
writeFileSync(join(process.cwd(), "public", "search-index.json"), `${JSON.stringify({ schema_version: "SearchIndexV2", generated_at: new Date(0).toISOString(), records }, null, 2)}\n`);
console.log(`Search index built: ${records.length} records.`);
