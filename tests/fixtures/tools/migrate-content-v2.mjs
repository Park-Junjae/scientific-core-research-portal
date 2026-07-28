import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "tests", "fixtures", "demo-content", "runs");
const text = (en, ko) => ({ en, ko });

const runs = {
  "xrrna-prime-assembly-demo": {
    title: text("xrRNA-guided Prime Assembly", "xrRNA 기반 Prime Assembly motif 비교"),
    short_title: text("xrRNA / Prime Assembly", "xrRNA / Prime Assembly"),
    subtitle: text("A focused comparison of structured-RNA motif roles in a multi-step prime-editing architecture", "구조화 RNA motif가 다단계 Prime Assembly 반응에 미치는 영향을 비교합니다."),
    domain: text("Genome editing", "유전체 편집"),
    question: text("Which structured-RNA motif configuration best preserves productive Prime Assembly while limiting partial products?", "어떤 구조화 RNA motif 구성이 부분 산물을 늘리지 않으면서 생산적인 Prime Assembly를 가장 잘 유지하는가?"),
    goal: text("Compare a primary symmetric motif panel with conditional, measurement, and parked alternatives without conflating research objects with report files.", "대칭 motif 비교를 중심으로 조건부 대안, 측정 프로그램, 보류 확장을 구분해 평가합니다."),
    bottleneck: text("Bulk guide abundance does not establish productive assembly or complete two-junction product formation.", "전체 guide RNA 양만으로는 생산적인 조립 상태나 양쪽 접합부가 완성된 산물을 확인할 수 없습니다."),
    summary: text("The portfolio prioritizes a symmetric structured-RNA motif comparison, keeps asymmetric arm assignment conditional, treats E_A as a measurement program, and parks the QuadPE extension.", "이 포트폴리오는 대칭 구조화 RNA motif 비교를 우선하고, 비대칭 arm 배정은 조건부로 유지하며, E_A는 측정 프로그램으로 다루고 QuadPE 확장은 보류합니다."),
    decision: text("Proceed with the symmetric motif comparison; require arm-specific evidence before asymmetry; resolve molecular identity before using E_A; do not expand to QuadPE yet.", "대칭 motif 비교를 우선합니다. 비대칭 배정에는 arm별 근거가 필요하고, E_A는 분자 정체성 확인이 선행되어야 하며, QuadPE 확장은 현재 진행하지 않습니다."),
    tags: [text("prime editing", "프라임 에디팅"), text("RNA structure", "RNA 구조"), text("focused decision", "집중 의사결정")],
    literature: { report_reference_count: 4, final_reference_count: 4 },
    reading: [text("Scientific summary", "연구 요약"), text("Knowledge background", "지식 배경"), text("Primary and conditional ideas", "주요 및 조건부 아이디어"), text("Run specification", "연구 명세")],
  },
  "prame-logic-first-demo": {
    title: text("PRAME Logic-First Transfer", "PRAME 논리 우선 전이"),
    short_title: text("PRAME Logic-First", "PRAME 논리 우선"),
    subtitle: text("A focused decision run centered on transfer logic and evidence boundaries", "전이 논리와 근거 경계를 먼저 확인하는 집중 의사결정 연구입니다."),
    domain: text("Immuno-oncology", "면역항암"),
    question: text("Which target-context and verifier conditions must hold before a PRAME transfer claim is interpretable?", "PRAME 전이 주장을 해석하려면 어떤 표적 맥락과 검증 조건이 먼저 충족되어야 하는가?"),
    goal: text("Define a target-context gate and a verifier-first contrast before any broader transfer claim.", "광범위한 전이 주장에 앞서 표적 맥락 관문과 검증 우선 비교를 정의합니다."),
    bottleneck: text("A positive downstream signal can remain ambiguous when target context and verifier recovery are not separated.", "표적 맥락과 검증기의 회수 성능을 분리하지 않으면 하류 신호가 양성이어도 원인을 해석하기 어렵습니다."),
    summary: text("The primary object is a target-context gate. A verifier-first contrast remains conditional on analytical identifiability.", "주요 연구 대상은 표적 맥락 관문입니다. 검증 우선 비교는 분석적 식별 가능성이 확보될 때만 조건부로 진행합니다."),
    decision: text("Resolve target context first and retain the verifier contrast only if it can distinguish the required molecular state.", "표적 맥락을 먼저 확인하고, 필요한 분자 상태를 구분할 수 있을 때만 검증 비교를 유지합니다."),
    tags: [text("PRAME", "PRAME"), text("transfer", "전이"), text("evidence boundary", "근거 경계")],
    literature: { report_reference_count: 3, final_reference_count: 3 },
    reading: [text("Scientific summary", "연구 요약"), text("Transfer background", "전이 배경"), text("Research objects", "연구 대상"), text("Run specification", "연구 명세")],
  },
  "taled-historical-demo": {
    title: text("TALED Editing-Window Study", "TALED 편집 범위 연구"),
    short_title: text("TALED historical case", "TALED 과거 사례"),
    subtitle: text("An archived child-run lineage preserved without cross-run count aggregation", "실행 간 수치를 합산하지 않고 보존한 과거 하위 연구입니다."),
    domain: text("Mitochondrial genome editing", "미토콘드리아 유전체 편집"),
    question: text("Could geometry or exposure time narrow the TALED A-to-G editing window without proportional activity loss?", "기하학적 배치나 노출 시간이 전체 활성을 비례해 낮추지 않으면서 TALED A-to-G 편집 범위를 좁힐 수 있는가?"),
    goal: text("Preserve two historical mechanism axes for reading without treating archived ideas as current recommendations.", "두 가지 과거 기전 축을 현재 권고안으로 오해하지 않도록 읽기 자료로 보존합니다."),
    bottleneck: text("Window narrowing and activity preservation were not jointly established in this archived demonstration.", "이 과거 데모에서는 편집 범위 축소와 활성 유지가 함께 입증되지 않았습니다."),
    summary: text("Helical phase and exposure-time distribution are retained as historical, parked ideas. Neither is presented as a current validated mechanism.", "나선 위상과 노출 시간 분포를 과거의 보류 아이디어로 유지합니다. 어느 쪽도 현재 검증된 기전으로 제시하지 않습니다."),
    decision: text("Archive both ideas and retain their causal framing for comparison only.", "두 아이디어를 보관하고 인과적 관점만 비교 자료로 유지합니다."),
    tags: [text("TALED", "TALED"), text("editing window", "편집 범위"), text("historical", "과거 사례")],
    literature: { report_reference_count: 4, final_reference_count: 4 },
    reading: [text("Scientific summary", "연구 요약"), text("Historical background", "과거 배경"), text("Parked ideas", "보류 아이디어"), text("Run specification", "연구 명세")],
  },
};

const ideas = {
  "assembly-state-gate": ["Symmetric structured-RNA motif panel for Prime Assembly", "Prime Assembly 대칭 구조화 RNA motif 비교", "A paired motif panel asks whether structured-RNA protection preserves productive assembly rather than merely increasing mature RNA abundance.", "대칭 motif 비교는 구조화 RNA 보호가 성숙 RNA 양만 늘리는 것이 아니라 생산적인 조립 상태를 보존하는지 묻습니다.", "A direct, bounded comparison can separate product formation from generic RNA stabilization.", "제한된 직접 비교로 완전 산물 형성과 일반적인 RNA 안정화를 구분할 수 있습니다."],
  "asymmetric-arm-assignment": ["Asymmetric arm assignment", "비대칭 arm motif 배정", "Distinct motifs may be useful only when one Prime Assembly arm is repeatedly limiting.", "한쪽 Prime Assembly arm이 반복적으로 제한될 때만 서로 다른 motif 배정이 유용할 수 있습니다.", "The idea is conditional because arm-specific limitation must be demonstrated first.", "먼저 arm별 제한을 확인해야 하므로 조건부 아이디어입니다."],
  "intermediate-readout": ["E_A molecular-identity measurement architecture", "E_A 분자 정체성 측정 체계", "A measurement program asks whether the relevant early intermediate can be identified on the same recovered molecule.", "관련 초기 중간체의 정체성을 같은 회수 분자에서 확인할 수 있는지 검토하는 측정 프로그램입니다.", "Causal attribution is not interpretable without provenance-secure molecular identity.", "출처가 보장된 분자 정체성 없이는 인과 관계를 해석할 수 없습니다."],
  "quadpe-balancing-extension": ["QuadPE balancing extension", "QuadPE 균형 확장", "A parked extension considers whether four-arm balancing could rescue asymmetric losses after simpler contrasts are resolved.", "더 단순한 비교가 끝난 뒤 네 arm의 균형 조절이 비대칭 손실을 보완할 수 있는지 검토하는 보류 확장입니다.", "Its complexity is not justified before the primary two-arm comparison is interpretable.", "주요 두 arm 비교를 해석하기 전에는 추가 복잡성을 정당화할 수 없습니다."],
  "target-context-gate": ["Target-context gate before transfer", "전이에 앞선 표적 맥락 관문", "The primary object tests whether the target context supports an interpretable transfer claim before downstream optimization.", "하류 최적화 전에 표적 맥락이 해석 가능한 전이 주장을 뒷받침하는지 확인합니다.", "It prevents downstream signal from being mistaken for target-specific transfer.", "하류 신호를 표적 특이적 전이로 잘못 해석하는 일을 막습니다."],
  "verifier-first-contrast": ["Verifier-first contrast", "검증 우선 비교", "A conditional contrast proceeds only when the verifier can distinguish the required molecular classes.", "검증기가 필요한 분자 부류를 구분할 수 있을 때만 진행하는 조건부 비교입니다.", "Analytical identifiability must precede biological interpretation.", "생물학적 해석에 앞서 분석적 식별 가능성이 확보되어야 합니다."],
  "exposure-time-distribution": ["Exposure-time distribution as a product-purity coordinate", "산물 순도를 결정하는 노출 시간 분포", "A historical idea reframes product purity as a distribution of catalytic exposure rather than only static reach.", "산물 순도를 정적인 도달 거리뿐 아니라 촉매 노출 시간의 분포로 보는 과거 아이디어입니다.", "It could explain multi-edit reads but remains parked without a decisive time-resolved test.", "다중 편집 read를 설명할 수 있지만 시간 분해 판별 실험이 없어 보류 상태입니다."],
  "helical-phase-coordinate": ["Helical phase as a catalytic positioning coordinate", "촉매 위치 좌표로서의 나선 위상", "A historical idea treats spacer changes as rotational registry rather than distance alone.", "spacer 변화를 거리뿐 아니라 회전 정렬로 보는 과거 아이디어입니다.", "Phase-dependent activity shifts would distinguish it from generic linker shortening.", "위상에 따른 활성 이동이 나타나야 단순 linker 단축과 구분할 수 있습니다."],
};

function loc(en, ko) { return text(en ?? "", ko ?? ""); }
function report(id, group, role, title, description, language, markdown, order, references = null) {
  return { schema_version: "ResearchReportManifestV2", report_id: id, translation_group_id: group, role, localized_title: title, localized_description: description, language, path: null, markdown_path: markdown, page_count: null, reference_count: references, primary_source_count: null, report_status: "DEMO_SUMMARY", is_primary: role === "RESEARCH_SUMMARY", display_order: order, updated_at: "2026-07-22T00:00:00Z" };
}

for (const slug of readdirSync(root, { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name)) {
  const dir = join(root, slug);
  const old = JSON.parse(readFileSync(join(dir, "run.json"), "utf8"));
  const tr = runs[slug];
  if (!tr) continue;
  mkdirSync(join(dir, "reports"), { recursive: true });
  const summaryEn = `# ${tr.title.en}\n\n${tr.summary.en}\n\n## Research question\n\n${tr.question.en}\n\n## Current decision\n\n${tr.decision.en}\n`;
  const summaryKo = `# ${tr.title.ko}\n\n${tr.summary.ko}\n\n## 연구 질문\n\n${tr.question.ko}\n\n## 현재 결정\n\n${tr.decision.ko}\n`;
  const specEn = `# Run specification\n\n## Research question\n${tr.question.en}\n\n## Research goal\n${tr.goal.en}\n\n## Current bottleneck\n${tr.bottleneck.en}\n\n## Success criteria\n- Produce an interpretable comparison tied to the stated decision.\n\n## Experimental constraints\n- Do not extend beyond the bounded demonstration scope.\n\n## Non-goals\n- No scientific validation claim.\n\n## Requested outputs\n- Scientific summary\n- Research-object portfolio\n`;
  const specKo = `# 연구 명세\n\n## 연구 질문\n${tr.question.ko}\n\n## 연구 목표\n${tr.goal.ko}\n\n## 현재 병목\n${tr.bottleneck.ko}\n\n## 성공 기준\n- 명시된 결정과 연결되는 해석 가능한 비교를 제시합니다.\n\n## 실험 제약\n- 제한된 데모 범위를 확장하지 않습니다.\n\n## 비목표\n- 과학적 검증을 주장하지 않습니다.\n\n## 요청 산출물\n- 연구 요약\n- 연구 대상 포트폴리오\n`;
  writeFileSync(join(dir, "reports", "research-summary-en.md"), summaryEn);
  writeFileSync(join(dir, "reports", "research-summary-ko.md"), summaryKo);
  writeFileSync(join(dir, "reports", "run-specification-en.md"), specEn);
  writeFileSync(join(dir, "reports", "run-specification-ko.md"), specKo);

  const knowledge = old.knowledge_refs?.find((item) => item.kind === "MARKDOWN");
  const reports = [
    report(`${slug}-summary-en`, `${slug}-summary`, "RESEARCH_SUMMARY", loc("Research summary", "연구 요약"), loc("A concise account of the question and current decision.", "연구 질문과 현재 결정을 간결하게 정리합니다."), "en", "reports/research-summary-en.md", 1),
    report(`${slug}-summary-ko`, `${slug}-summary`, "RESEARCH_SUMMARY", loc("Research summary", "연구 요약"), loc("A concise account of the question and current decision.", "연구 질문과 현재 결정을 간결하게 정리합니다."), "ko", "reports/research-summary-ko.md", 1),
    report(`${slug}-spec-en`, `${slug}-spec`, "RUN_SPECIFICATION", loc("Run specification", "연구 명세"), loc("Question, goals, constraints, and requested outputs.", "연구 질문, 목표, 제약 및 요청 산출물입니다."), "en", "reports/run-specification-en.md", 3),
    report(`${slug}-spec-ko`, `${slug}-spec`, "RUN_SPECIFICATION", loc("Run specification", "연구 명세"), loc("Question, goals, constraints, and requested outputs.", "연구 질문, 목표, 제약 및 요청 산출물입니다."), "ko", "reports/run-specification-ko.md", 3),
  ];
  if (knowledge) reports.push(report(`${slug}-knowledge-en`, `${slug}-knowledge`, "KNOWLEDGE_BACKGROUND", loc("Knowledge background", "지식 배경"), loc("Background needed to assess this run.", "이 연구를 평가하는 데 필요한 배경입니다."), "en", knowledge.path, 2, tr.literature.final_reference_count));

  const converted = {
    ...old,
    schema_version: "ResearchRunManifestV2",
    title: tr.title, short_title: tr.short_title, subtitle: tr.subtitle,
    research_domain: tr.domain, research_question: tr.question, research_goal: tr.goal,
    current_bottleneck: tr.bottleneck,
    success_criteria: [text("Produce an interpretable comparison tied to the stated decision.", "명시된 결정과 연결되는 해석 가능한 비교를 제시합니다.")],
    experimental_constraints: [text("Remain within the bounded demonstration scope.", "제한된 데모 범위를 유지합니다.")],
    non_goals: [text("No scientific validation claim.", "과학적 검증을 주장하지 않습니다.")],
    requested_outputs: [text("Scientific summary", "연구 요약"), text("Research-object portfolio", "연구 대상 포트폴리오")],
    summary: tr.summary, scientific_decision: tr.decision, reading_order: tr.reading, tags: tr.tags,
    timeline: old.timeline.map((entry) => ({ date: entry.date, label: loc(entry.label, entry.label === "Published" ? "공개" : entry.label === "Framing" ? "문제 정의" : "검토"), detail: loc(entry.detail, "해당 단계의 기록을 보존했습니다.") })),
    reports,
    historical_fixture_paths: readdirSync(join(dir, "reports")).filter((name) => name.endsWith(".md") && !name.startsWith("research-summary-") && !name.startsWith("run-specification-")).map((name) => `reports/${name}`),
    artifact_refs: (old.artifact_refs ?? []).map((item) => ({ ...item, title: loc(item.title, "기술 자료") })),
    primary_report_id: `${slug}-summary-en`, primary_knowledge_id: knowledge ? `${slug}-knowledge-en` : `${slug}-summary-en`, primary_summary_id: `${slug}-summary-en`, run_specification_id: `${slug}-spec-en`,
    literature_stats: tr.literature,
    literature_index: slug === "xrrna-prime-assembly-demo" ? [{ title: "Search-and-replace genome editing without double-strand breaks or donor DNA", authors: ["Anzalone AV", "Randolph PB", "Davis JR"], doi: "10.1038/s41586-019-1711-4" }] : [],
    pairwise_selection_impact: loc(old.pairwise_selection_impact, "비교 신호는 연구 결정의 보조 자료로만 사용했습니다."),
  };
  delete converted.report_refs;
  delete converted.knowledge_refs;
  writeFileSync(join(dir, "run.json"), `${JSON.stringify(converted, null, 2)}\n`);

  const ideaDir = join(dir, "ideas");
  for (const file of readdirSync(ideaDir).filter((name) => name.endsWith(".json"))) {
    const path = join(ideaDir, file);
    const oldIdea = JSON.parse(readFileSync(path, "utf8"));
    const [titleEn, titleKo, abstractEn, abstractKo, whyEn, whyKo] = ideas[oldIdea.slug];
    const next = {
      ...oldIdea,
      schema_version: "ResearchIdeaManifestV2",
      title: loc(titleEn, titleKo), short_title: loc(oldIdea.short_title, titleKo), abstract: loc(abstractEn, abstractKo),
      category: loc(oldIdea.category, "기전 중심"), disposition: loc(oldIdea.disposition, oldIdea.lifecycle_status === "PARKED" ? "보류" : oldIdea.lifecycle_status === "CONDITIONAL" ? "조건부 유지" : "우선 검토"), recommendation: loc(oldIdea.recommendation, oldIdea.lifecycle_status === "PARKED" ? "현재 보류" : "제한된 후속 검토"),
      tags: oldIdea.tags.map((tag) => loc(tag, tag)), report_id: null,
      disposition_reason: loc(oldIdea.disposition_reason, whyKo), nearest_prior_art: loc(oldIdea.nearest_prior_art ?? "No direct match recorded.", "직접적으로 일치하는 선행 사례는 기록되지 않았습니다."), strongest_reason: loc(oldIdea.strongest_reason, whyKo), weakest_causal_edge: loc(oldIdea.weakest_causal_edge, "핵심 인과 연결은 아직 직접 확인되지 않았습니다."),
      fatal_flaw: oldIdea.fatal_flaw ? loc(oldIdea.fatal_flaw, "치명적 반대 근거가 기록되었습니다.") : null,
      pairwise_summary: loc(oldIdea.pairwise_summary ?? "No pairwise comparison was required.", "별도 쌍대 비교는 필요하지 않았습니다."), reviewer_disagreement: loc(oldIdea.reviewer_disagreement ?? "No material disagreement recorded.", "중요한 검토자 이견은 기록되지 않았습니다."), reviewer_critiques: oldIdea.reviewer_critiques.map((value) => loc(value, "판별 가능한 측정과 대조군이 필요합니다.")),
      finalist_reason: oldIdea.finalist_reason ? loc(oldIdea.finalist_reason, "제한된 평가 대상으로 유지했습니다.") : undefined, reentry_condition: oldIdea.reentry_condition ? loc(oldIdea.reentry_condition, "재검토 조건을 충족해야 합니다.") : undefined,
      scientific_summary: loc(oldIdea.scientific_summary, abstractKo), why_this_idea: loc(whyEn, whyKo), causal_mechanism: loc(oldIdea.causal_mechanism, "개입이 관련 분자 상태의 분포를 바꾸고 최종 산물에 영향을 줄 수 있다는 가설입니다."), evidence_basis: loc(oldIdea.evidence_basis, "현재 근거는 제한된 성분 수준 또는 유추 근거입니다."), proposed_comparison: loc(oldIdea.next_discriminating_experiment, "관련 상태와 최종 산물을 같은 비교군에서 측정합니다."), expected_result: loc("A supportive result changes the intended product more strongly than bulk abundance or burden.", "지지 결과에서는 전체 양이나 부담보다 의도한 산물이 더 선택적으로 변해야 합니다."), next_discriminating_experiment: loc(oldIdea.next_discriminating_experiment, "판별 가능한 대조군과 함께 핵심 상태 및 최종 산물을 비교합니다."),
    };
    delete next.language_variants; delete next.report_pdf; delete next.report_markdown;
    writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`);
  }
}

console.log("Migrated synthetic fixtures to ResearchRunManifestV2 without assigning placeholder PDFs.");
