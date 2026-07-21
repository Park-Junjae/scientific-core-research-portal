"use client";

import { Check, Clipboard, Download, FileJson, FileText } from "lucide-react";
import { useMemo, useState } from "react";

type RunRequest = {
  title: string;
  research_question: string;
  research_goal: string;
  current_bottleneck: string;
  experimental_constraints: string;
  success_criteria: string;
  failure_criteria: string;
  non_goals: string;
  preferred_output_language: "English" | "Korean" | "Bilingual";
  visibility: "PRIVATE" | "LAB_INTERNAL" | "PUBLIC_SANITIZED";
  notes: string;
};

const initial: RunRequest = { title: "", research_question: "", research_goal: "", current_bottleneck: "", experimental_constraints: "", success_criteria: "", failure_criteria: "", non_goals: "", preferred_output_language: "Bilingual", visibility: "PRIVATE", notes: "" };

function markdownFor(value: RunRequest) {
  return `# ${value.title || "Untitled research request"}\n\n## Research question\n${value.research_question || "Not provided"}\n\n## Research goal\n${value.research_goal || "Not provided"}\n\n## Current bottleneck\n${value.current_bottleneck || "Not provided"}\n\n## Experimental constraints\n${value.experimental_constraints || "Not provided"}\n\n## Success criteria\n${value.success_criteria || "Not provided"}\n\n## Failure criteria\n${value.failure_criteria || "Not provided"}\n\n## Non-goals\n${value.non_goals || "Not provided"}\n\n## Output\n- Language: ${value.preferred_output_language}\n- Visibility: ${value.visibility}\n\n## Notes\n${value.notes || "None"}\n`;
}

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  URL.revokeObjectURL(url);
}

export function NewRunBuilder() {
  const [value, setValue] = useState(initial);
  const [copied, setCopied] = useState(false);
  const requiredReady = Boolean(value.title.trim() && value.research_question.trim() && value.research_goal.trim());
  const markdown = useMemo(() => markdownFor(value), [value]);
  const update = (key: keyof RunRequest, next: string) => setValue((current) => ({ ...current, [key]: next }));
  const fields: Array<{ key: keyof RunRequest; label: string; hint: string; required?: boolean }> = [
    { key: "title", label: "Title", hint: "A literal, compact name for the research question", required: true },
    { key: "research_question", label: "Research question", hint: "The uncertainty this run should resolve", required: true },
    { key: "research_goal", label: "Research goal", hint: "What a useful answer should enable", required: true },
    { key: "current_bottleneck", label: "Current bottleneck", hint: "What standard approaches fail to explain or solve" },
    { key: "experimental_constraints", label: "Experimental constraints", hint: "Models, modalities, time, safety, or feasibility boundaries" },
    { key: "success_criteria", label: "Success criteria", hint: "What outcome would make the run useful" },
    { key: "failure_criteria", label: "Failure criteria", hint: "What result should stop or redirect the work" },
    { key: "non_goals", label: "Non-goals", hint: "Directions that are intentionally outside scope" },
    { key: "notes", label: "Notes", hint: "Context that does not fit above" },
  ];
  return (
    <div className="intake-layout">
      <form className="intake-form" onSubmit={(event) => event.preventDefault()}>
        <div className="static-notice"><strong>This page creates a run request.</strong><span>It does not execute Scientific Core.</span></div>
        {fields.map((field) => <label key={field.key}><span>{field.label}{field.required && <b aria-hidden="true"> *</b>}</span><small>{field.hint}</small>{field.key === "title" ? <input required={field.required} value={value[field.key]} onChange={(event) => update(field.key, event.target.value)} /> : <textarea required={field.required} rows={field.key === "notes" ? 3 : 4} value={value[field.key]} onChange={(event) => update(field.key, event.target.value)} />}</label>)}
        <div className="two-column-fields"><label><span>Preferred output language</span><select value={value.preferred_output_language} onChange={(event) => update("preferred_output_language", event.target.value)}><option>English</option><option>Korean</option><option>Bilingual</option></select></label><label><span>Visibility</span><select value={value.visibility} onChange={(event) => update("visibility", event.target.value)}><option value="PRIVATE">Private</option><option value="LAB_INTERNAL">Lab internal</option><option value="PUBLIC_SANITIZED">Public sanitized request</option></select></label></div>
      </form>
      <aside className="spec-preview"><div className="spec-preview-head"><div><p className="eyebrow">Live preview</p><h2>Run specification</h2></div><span className={requiredReady ? "ready-indicator ready" : "ready-indicator"}>{requiredReady ? "Ready" : "3 required fields"}</span></div><pre>{markdown}</pre><div className="preview-actions"><button className="primary-button" disabled={!requiredReady} onClick={() => download("run-request.json", JSON.stringify({ schema_version: "RunRequestV1", created_at: new Date().toISOString(), ...value }, null, 2), "application/json")}><FileJson size={17} />Download JSON</button><button className="secondary-button" disabled={!requiredReady} onClick={() => download("run-specification.md", markdown, "text/markdown")}><FileText size={17} />Download Markdown</button><button className="secondary-button" disabled={!requiredReady} onClick={async () => { await navigator.clipboard.writeText(`Launch a bounded Scientific Core workflow using this run specification. Do not infer authorization beyond the specification.\n\n${markdown}`); setCopied(true); setTimeout(() => setCopied(false), 1600); }}>{copied ? <Check size={17} /> : <Clipboard size={17} />}{copied ? "Copied" : "Copy launch prompt"}</button></div><p className="preview-footnote"><Download size={15} />Downloads stay on this device. No request is sent to a server.</p></aside>
    </div>
  );
}
