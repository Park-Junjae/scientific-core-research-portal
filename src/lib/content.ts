import fs from "node:fs";
import path from "node:path";
import type { Locale, ResearchIdeaManifest, ResearchReportManifestV2, ResearchRunManifest, ResearchSourceIndexV1, ResearchSourceManifestV1, RunWithIdeas, SearchRecord } from "./types";
import { isVisiblePublicReport } from "./report-visibility";

const publicRunsRoot = path.join(process.cwd(), "content", "runs");
const localRunsRoot = path.join(process.cwd(), ".local-preview", "content", "runs");
const demoRunsRoot = path.join(process.cwd(), "tests", "fixtures", "demo-content", "runs");
const includeLocalPreview = process.env.SCIENTIFIC_CORE_INCLUDE_LOCAL_PREVIEW === "1";
const includeDemoFixtures = process.env.SCIENTIFIC_CORE_TEST_ONLY_DEMO_FIXTURES === "1";

function readJson<T>(filePath: string): T { return JSON.parse(fs.readFileSync(filePath, "utf8")) as T; }

function runRoots() {
  const roots = [publicRunsRoot];
  if (includeLocalPreview && fs.existsSync(localRunsRoot)) roots.push(localRunsRoot);
  if (includeDemoFixtures && fs.existsSync(demoRunsRoot)) roots.push(demoRunsRoot);
  return roots;
}

function indexedSlugs(root: string): string[] {
  const index = path.join(root, "index.json");
  return fs.existsSync(index) ? readJson<{ runs: string[] }>(index).runs : [];
}

function rootForRun(slug: string): string {
  const root = runRoots().find((candidate) => fs.existsSync(path.join(candidate, slug, "run.json")));
  if (!root) throw new Error(`Unknown run: ${slug}`);
  return root;
}

export function validatePrimaryArtifacts(run: ResearchRunManifest) {
  const ids = new Set(run.reports.map((report) => report.report_id));
  const required = [run.primary_report_id, run.primary_knowledge_id, run.primary_summary_id, run.run_specification_id];
  for (const id of required) if (!ids.has(id)) throw new Error(`${run.slug}: primary artifact ${id} does not exist`);
}

export function getRuns(): RunWithIdeas[] {
  const slugs = Array.from(new Set(runRoots().flatMap(indexedSlugs)));
  const byRunId = new Map<string, RunWithIdeas>();
  for (const slug of slugs) {
    const run = getRun(slug);
    const productionVisible = run.publication_status === "APPROVED"
      && run.source_type !== "SYNTHETIC_DEMO";
    if (
      (includeDemoFixtures || includeLocalPreview || productionVisible)
      && !byRunId.has(run.run_id)
    ) {
      byRunId.set(run.run_id, run);
    }
  }
  return Array.from(byRunId.values());
}

export function getRun(slug: string): RunWithIdeas {
  const root = path.join(rootForRun(slug), slug);
  const run = readJson<ResearchRunManifest>(path.join(root, "run.json"));
  validatePrimaryArtifacts(run);
  const ideas = run.idea_refs.map((ideaSlug) => readJson<ResearchIdeaManifest>(path.join(root, "ideas", `${ideaSlug}.json`)));
  const literaturePath = path.join(root, "literature", "index.json");
  const sources = fs.existsSync(literaturePath) ? readJson<ResearchSourceIndexV1>(literaturePath).sources : [];
  return { ...run, ideas, sources };
}

export function getIdea(runSlug: string, ideaSlug: string): ResearchIdeaManifest {
  return readJson<ResearchIdeaManifest>(path.join(rootForRun(runSlug), runSlug, "ideas", `${ideaSlug}.json`));
}

export function getReport(run: ResearchRunManifest, reportId: string): ResearchReportManifestV2 {
  const report = run.reports.find((candidate) => candidate.report_id === reportId);
  if (!report) throw new Error(`${run.slug}: report ${reportId} does not exist`);
  return report;
}

export function getSource(runSlug: string, sourceId: string): ResearchSourceManifestV1 {
  const source = getRun(runSlug).sources.find((candidate) => candidate.source_id === sourceId);
  if (!source) throw new Error(`${runSlug}: source ${sourceId} does not exist`);
  return source;
}

export function reportForLocale(run: ResearchRunManifest, reportId: string, locale: Locale): ResearchReportManifestV2 | null {
  const selected = getReport(run, reportId);
  if (selected.language === locale) return selected;
  return run.reports.find((candidate) => candidate.translation_group_id === selected.translation_group_id && candidate.language === locale) ?? null;
}

export function reportsByRole(run: ResearchRunManifest, role: ResearchReportManifestV2["role"]) {
  return run.reports.filter((report) => report.role === role).sort((a, b) => a.display_order - b.display_order);
}

export function readApprovedMarkdown(runSlug: string, relativePath: string): string {
  const runRoot = path.resolve(rootForRun(runSlug), runSlug);
  const resolved = path.resolve(runRoot, relativePath);
  if (!resolved.startsWith(`${runRoot}${path.sep}`)) throw new Error("Artifact path escaped the approved run bundle");
  return fs.readFileSync(resolved, "utf8");
}

export function markdownForReports(run: ResearchRunManifest, reports = run.reports): Record<string, string> {
  return Object.fromEntries(reports.filter((report) => report.markdown_path).map((report) => [report.report_id, readApprovedMarkdown(run.slug, report.markdown_path!)]));
}

const EMPTY_RUN_SLUG = "__no_public_run__";

export function getAllRunParams() {
  const params = getRuns().map((run) => ({ run_slug: run.slug }));
  return params.length > 0 ? params : [{ run_slug: EMPTY_RUN_SLUG }];
}

export function getAllIdeaParams() {
  const params = getRuns().flatMap((run) => run.ideas.map((idea) => ({ run_slug: run.slug, idea_slug: idea.slug })));
  return params.length > 0 ? params : [{ run_slug: EMPTY_RUN_SLUG, idea_slug: "__no_public_idea__" }];
}

export function getAllReportParams() {
  const params = getRuns().flatMap((run) => run.reports
    .filter(isVisiblePublicReport)
    .map((report) => ({ run_slug: run.slug, report_id: report.report_id })));
  return params.length > 0 ? params : [{ run_slug: EMPTY_RUN_SLUG, report_id: "__no_public_report__" }];
}

export function getAllSourceParams() {
  const params = getRuns().flatMap((run) => run.sources.map((source) => ({ run_slug: run.slug, source_id: source.source_id })));
  return params.length > 0 ? params : [{ run_slug: EMPTY_RUN_SLUG, source_id: "__no_public_source__" }];
}

export function getSearchRecords(): SearchRecord[] {
  const file = path.join(process.cwd(), "public", "search-index.json");
  return fs.existsSync(file) ? readJson<{ records: SearchRecord[] }>(file).records : [];
}

export function isLocalPreviewEnabled() { return includeLocalPreview; }

export function isDemoFixtureEnabled() { return includeDemoFixtures; }
