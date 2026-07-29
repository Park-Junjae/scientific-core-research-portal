export const COMPACT_RESEARCH_TITLE_LIMIT = 96;

const listPrefix = /^\s*(?:(?:[-*+•‣◦]+|#{1,6}|>+|\d{1,3}[.)]|[\[(]\d{1,3}[\])])\s*)+/u;
const labelPrefix = /^\s*(?:research\s+(?:goal|question)|goal|question|연구\s*(?:목표|질문)|목표|질문)\s*[:：\-–—]\s*/iu;

function normalizeCandidate(value: string) {
  return value
    .replace(listPrefix, "")
    .replace(labelPrefix, "")
    .replace(listPrefix, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function firstMeaningfulSentence(value: string) {
  const firstLine = value
    .split(/\r?\n/u)
    .map(normalizeCandidate)
    .find(Boolean);
  const candidate = firstLine || normalizeCandidate(value);
  for (let index = 0; index < candidate.length; index += 1) {
    if (!".!?。！？".includes(candidate[index])) continue;
    const following = candidate[index + 1];
    if (!following || /\s/u.test(following)) {
      return candidate.slice(0, index + 1).trim();
    }
  }
  return candidate;
}

function graphemes(value: string) {
  const Segmenter = (
    Intl as unknown as {
      Segmenter?: new (
        locale?: string,
        options?: { granularity: "grapheme" },
      ) => { segment: (input: string) => Iterable<{ segment: string }> };
    }
  ).Segmenter;
  if (!Segmenter) return Array.from(value);
  return Array.from(
    new Segmenter(undefined, { granularity: "grapheme" }).segment(value),
    (item) => item.segment,
  );
}

export function compactResearchTitle(value = "") {
  const candidate = firstMeaningfulSentence(value);
  if (!candidate) return "";
  const clusters = graphemes(candidate);
  if (clusters.length <= COMPACT_RESEARCH_TITLE_LIMIT) return candidate;
  return `${clusters.slice(0, COMPACT_RESEARCH_TITLE_LIMIT - 1).join("").trimEnd()}…`;
}
