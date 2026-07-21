import fs from "node:fs";
import path from "node:path";
import type { ResearchIdeaManifest, ResearchRunManifest, RunWithIdeas } from "./types";

const runsRoot = path.join(process.cwd(), "content", "runs");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getRuns(): RunWithIdeas[] {
  const index = readJson<{ runs: string[] }>(path.join(runsRoot, "index.json"));
  return index.runs.map((slug) => getRun(slug));
}

export function getRun(slug: string): RunWithIdeas {
  const root = path.join(runsRoot, slug);
  const run = readJson<ResearchRunManifest>(path.join(root, "run.json"));
  const ideas = run.idea_refs.map((ideaSlug) =>
    readJson<ResearchIdeaManifest>(path.join(root, "ideas", `${ideaSlug}.json`)),
  );
  return { ...run, ideas };
}

export function getIdea(runSlug: string, ideaSlug: string): ResearchIdeaManifest {
  return readJson<ResearchIdeaManifest>(
    path.join(runsRoot, runSlug, "ideas", `${ideaSlug}.json`),
  );
}

export function readApprovedMarkdown(runSlug: string, relativePath: string): string {
  const runRoot = path.resolve(runsRoot, runSlug);
  const resolved = path.resolve(runRoot, relativePath);
  if (!resolved.startsWith(`${runRoot}${path.sep}`)) {
    throw new Error("Artifact path escaped the approved run bundle");
  }
  return fs.readFileSync(resolved, "utf8");
}

export function getAllIdeaParams() {
  return getRuns().flatMap((run) =>
    run.ideas.map((idea) => ({ run_slug: run.slug, idea_slug: idea.slug })),
  );
}
