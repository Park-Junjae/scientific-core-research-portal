from __future__ import annotations

import hashlib
import json
import re
import shutil
import unicodedata
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import urlparse

from jsonschema import Draft202012Validator, FormatChecker


ABSOLUTE_PATH = re.compile(r"(?:(?<![A-Za-z0-9])[A-Za-z]:[\\/]|/home/|/Users/|/private/var/)", re.IGNORECASE)
SECRET_PATTERN = re.compile(
    r"(?:sk-(?:proj-)?[A-Za-z0-9_-]{16,}|OPENAI_API_KEY|ANTHROPIC_API_KEY|BEGIN (?:RSA|OPENSSH) PRIVATE KEY)",
    re.IGNORECASE,
)
RAW_PRIVATE_PATTERN = re.compile(
    r"(?:provider[_-]raw|raw[_-]response|private[_-]prompt|registry\.jsonl|receipt[_-]raw)",
    re.IGNORECASE,
)
ALLOWED_TEXT = {".json", ".md", ".csv", ".txt", ".yaml", ".yml"}
PUBLICATION_OUTPUTS = {
    "PUBLICATION_RECEIPT.json",
    "PUBLICATION_CONTENT_HASHES.json",
    "SANITIZATION_AUDIT.json",
    "PUBLICATION_DIFF.md",
}
ARTIFACT_MANIFESTS = {
    "reports/report-manifest.json": "report_refs",
    "knowledge/knowledge-manifest.json": "knowledge_refs",
    "artifacts/artifact-manifest.json": "artifact_refs",
}
DEVELOPED_LIFECYCLES = {
    "DEVELOPED", "REVIEWED", "REVISION_REQUIRED", "REVISED", "ARENA_ELIGIBLE",
    "ARENA_COMPARED", "FINALIST", "CONDITIONAL", "MEASUREMENT_PROGRAM", "PARKED",
    "DROPPED",
}
REVIEWED_LIFECYCLES = {
    "REVIEWED", "REVISION_REQUIRED", "REVISED", "ARENA_ELIGIBLE", "ARENA_COMPARED",
    "FINALIST", "CONDITIONAL", "MEASUREMENT_PROGRAM", "PARKED", "DROPPED",
}
ARENA_LIFECYCLES = {"ARENA_ELIGIBLE", "ARENA_COMPARED", "FINALIST"}
RETAINED_LIFECYCLES = {
    "DEVELOPED", "REVIEWED", "REVISION_REQUIRED", "REVISED", "ARENA_ELIGIBLE",
    "ARENA_COMPARED", "FINALIST", "CONDITIONAL", "MEASUREMENT_PROGRAM",
}
ANALYZED_LITERATURE_STAGES = {
    "SOURCE_ATLAS_CURATED",
    "BIBLIOGRAPHY_SOURCE_VERIFIED",
    "TITLE_ABSTRACT_SCREENED",
    "FULL_TEXT_TRIAGED",
    "FULL_TEXT_REVIEWED",
    "DEEPLY_READ",
    "LOAD_BEARING",
    "CITED",
}
SOURCE_ANALYSIS_EVENTS = {
    "SOURCE_ATLAS_CURATED",
    "TITLE_ABSTRACT_ANALYZED",
    "FULL_TEXT_REVIEWED",
    "MECHANISM_EVIDENCE_MAPPED",
    "CONTRADICTORY_EVIDENCE_MAPPED",
    "REPORT_ARGUMENT_USED",
    "BIBLIOGRAPHY_SOURCE_VERIFIED",
}


class PublicationError(RuntimeError):
    """Raised when a publication boundary or content contract fails."""


@dataclass(frozen=True)
class CopiedArtifact:
    relative_path: str
    sha256: str
    size_bytes: int


def _normalized_doi(value: Any) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = value.strip().lower()
    normalized = re.sub(r"^(?:https?://(?:dx\.)?doi\.org/|doi:\s*)", "", normalized)
    return normalized.rstrip(". ") or None


def _normalized_pmid(value: Any) -> str | None:
    if not isinstance(value, (str, int)):
        return None
    normalized = str(value).strip().lower()
    normalized = re.sub(r"^(?:pmid:\s*|https?://pubmed\.ncbi\.nlm\.nih\.gov/)", "", normalized)
    return normalized.strip("/ ") or None


def _normalized_title(value: Any) -> str | None:
    if isinstance(value, dict):
        value = value.get("en") or value.get("ko") or next(iter(value.values()), None)
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = unicodedata.normalize("NFKC", value).casefold()
    normalized = " ".join(re.findall(r"\w+", normalized, flags=re.UNICODE))
    return normalized or None


def _analyzed_source_key(source: dict[str, Any]) -> tuple[str, ...] | None:
    doi = _normalized_doi(source.get("doi"))
    if doi:
        return ("doi", doi)
    pmid = _normalized_pmid(source.get("pmid"))
    if pmid:
        return ("pmid", pmid)
    title = _normalized_title(
        source.get("title")
        or source.get("localized_title")
        or source.get("normalized_title")
    )
    year = source.get("year") or source.get("publication_year")
    if title and isinstance(year, int):
        return ("title_year", title, str(year))
    return None


def derive_analyzed_unique_total(sources: list[dict[str, Any]]) -> int | None:
    """Count stage-qualified records by DOI, PMID, then normalized title and year."""
    staged = [source for source in sources if source.get("analysis_stage") in ANALYZED_LITERATURE_STAGES]
    if not staged:
        return None
    keys = {key for source in staged if (key := _analyzed_source_key(source)) is not None}
    return len(keys) if keys else None


def derive_analyzed_unique_total_from_ledger(
    sources: list[dict[str, Any]],
) -> int | None:
    """Count identities with at least one documented scientific curation event."""
    analyzed = [
        source
        for source in sources
        if any(
            isinstance(event, dict)
            and event.get("event_type") in SOURCE_ANALYSIS_EVENTS
            for event in source.get("analysis_events", [])
        )
    ]
    if not analyzed:
        return None
    keys = {key for source in analyzed if (key := _analyzed_source_key(source))}
    return len(keys) if keys else None


def _unique_ledger_count(
    sources: list[dict[str, Any]], field: str
) -> int:
    keys = {
        key
        for source in sources
        if source.get(field) is True
        and (key := _analyzed_source_key(source)) is not None
    }
    return len(keys)


def _load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PublicationError(f"Cannot read JSON: {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise PublicationError(f"Expected a JSON object: {path}")
    return value


def _write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _tree_hash(root: Path) -> str:
    digest = hashlib.sha256()
    for item in root.rglob("*"):
        if item.is_symlink():
            raise PublicationError(
                f"Symlinks are not allowed in publication sources: {item.relative_to(root)}"
            )
    for file_path in sorted(item for item in root.rglob("*") if item.is_file()):
        digest.update(file_path.relative_to(root).as_posix().encode())
        digest.update(_sha256(file_path).encode())
    return digest.hexdigest()


def _safe_relative(value: str) -> PurePosixPath:
    normalized = value.replace("\\", "/")
    if "\x00" in normalized or re.match(r"^[A-Za-z]:/", normalized):
        raise PublicationError(f"Unsafe artifact path: {value}")
    path = PurePosixPath(normalized)
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise PublicationError(f"Unsafe artifact path: {value}")
    return path


def _source_file(root: Path, relative: PurePosixPath) -> Path:
    candidate = root.joinpath(*relative.parts)
    current = root
    for part in relative.parts:
        current = current / part
        if current.is_symlink():
            raise PublicationError(f"Symlinked publication source is not allowed: {relative}")
    try:
        resolved = candidate.resolve(strict=True)
    except OSError as exc:
        raise PublicationError(f"Allowlisted artifact is missing: {relative}") from exc
    if root != resolved and root not in resolved.parents:
        raise PublicationError(f"Artifact escaped the source run: {relative}")
    if not resolved.is_file():
        raise PublicationError(f"Allowlisted artifact is not a file: {relative}")
    return resolved


def _validate_against_schema(instance_path: Path, schema_path: Path) -> list[str]:
    instance = _load_json(instance_path)
    schema = _load_json(schema_path)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    return [
        f"{instance_path}: {'/'.join(map(str, error.absolute_path)) or '<root>'}: {error.message}"
        for error in sorted(
            validator.iter_errors(instance), key=lambda item: list(item.absolute_path)
        )
    ]


def _validate_value_against_schema(
    value: Any, source_label: str, schema_path: Path
) -> list[str]:
    schema = _load_json(schema_path)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    return [
        f"{source_label}: {'/'.join(map(str, error.absolute_path)) or '<root>'}: {error.message}"
        for error in sorted(
            validator.iter_errors(value), key=lambda item: list(item.absolute_path)
        )
    ]


def _citation_numbers(markdown: str) -> set[int]:
    numbers: set[int] = set()
    for match in re.finditer(r"\[(\d+(?:\s*(?:[-–,])\s*\d+)*)\]", markdown):
        for part in re.split(r"\s*,\s*", match.group(1)):
            bounds = re.split(r"\s*[-–]\s*", part)
            if len(bounds) == 2:
                start, end = map(int, bounds)
                numbers.update(range(min(start, end), max(start, end) + 1))
            else:
                numbers.add(int(bounds[0]))
    return numbers


def _matches_sensitive(value: str) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    for category, pattern in (
        ("absolute_path", ABSOLUTE_PATH),
        ("secret", SECRET_PATTERN),
        ("private_artifact", RAW_PRIVATE_PATTERN),
    ):
        if pattern.search(value):
            findings.append({"category": category, "evidence": "redacted"})
    return findings


def _scan_file(path: Path) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    if path.suffix.lower() in ALLOWED_TEXT:
        text = path.read_text(encoding="utf-8", errors="replace")
        findings.extend(_matches_sensitive(text))
    elif path.suffix.lower() == ".pdf":
        try:
            import fitz

            with fitz.open(path) as document:
                metadata = " ".join(str(value) for value in document.metadata.values())
                text = metadata + "\n" + "\n".join(page.get_text() for page in document)
            findings.extend(_matches_sensitive(text))
        except Exception:
            findings.append({"category": "invalid_pdf", "evidence": "redacted"})
    return [{"file": path.as_posix(), **finding} for finding in findings]


def _artifact_location(
    portal_root: Path, run_root: Path, value: str
) -> tuple[Path | None, str | None]:
    parsed = urlparse(value)
    if parsed.scheme in {"https", "http"}:
        return None, None
    if value.startswith("/artifacts/"):
        relative = _safe_relative(value.lstrip("/"))
        return portal_root / "public" / Path(*relative.parts), relative.as_posix()
    if value.startswith("/"):
        raise PublicationError(f"Unsupported root-relative artifact path: {value}")
    relative = _safe_relative(value)
    return run_root / Path(*relative.parts), None


def _validate_visibility(value: dict[str, Any], errors: list[str]) -> None:
    required = {
        "mode",
        "approved_by",
        "approved_at",
        "approved_run_ids",
        "public_release_approved",
    }
    missing = sorted(required - value.keys())
    if missing:
        errors.append(f"deploy/site_visibility.json is missing: {', '.join(missing)}")
        return
    if value["mode"] not in {"LOCAL_ONLY", "PUBLIC_SANITIZED", "LAB_INTERNAL"}:
        errors.append("deploy/site_visibility.json has an unsupported mode")
    if not isinstance(value["approved_run_ids"], list):
        errors.append("deploy/site_visibility.json approved_run_ids must be an array")
    if not isinstance(value["public_release_approved"], bool):
        errors.append("deploy/site_visibility.json public_release_approved must be boolean")
    if value["mode"] == "LOCAL_ONLY" and value["public_release_approved"]:
        errors.append("LOCAL_ONLY visibility cannot set public_release_approved=true")


def _portfolio_counts(ideas: list[dict[str, Any]]) -> dict[str, int]:
    lifecycles = [idea.get("lifecycle_status") for idea in ideas]
    families = {
        idea.get("family_id")
        for idea in ideas
        if isinstance(idea.get("family_id"), str) and idea.get("family_id")
    }
    return {
        "raw_generation_count": len(ideas),
        "independent_generation_count": sum(
            lifecycle != "MERGED_INTO_FAMILY" for lifecycle in lifecycles
        ),
        "natural_family_count": len(families),
        "developed_count": sum(lifecycle in DEVELOPED_LIFECYCLES for lifecycle in lifecycles),
        "reviewed_count": sum(lifecycle in REVIEWED_LIFECYCLES for lifecycle in lifecycles),
        "arena_entrant_count": sum(lifecycle in ARENA_LIFECYCLES for lifecycle in lifecycles),
        "finalist_count": lifecycles.count("FINALIST"),
        "parked_count": lifecycles.count("PARKED"),
        "dropped_count": sum(
            lifecycle in {"DROPPED", "ADMISSIBILITY_REJECTED"}
            for lifecycle in lifecycles
        ),
    }


def _validate_portfolio(
    slug: str, run: dict[str, Any], ideas: list[dict[str, Any]], errors: list[str]
) -> None:
    computed = _portfolio_counts(ideas)
    funnel = run.get("portfolio_funnel", {})
    for field, expected in computed.items():
        if funnel.get(field) != expected:
            errors.append(
                f"{slug}: portfolio_funnel.{field}={funnel.get(field)!r} "
                f"does not reconcile with idea manifests ({expected})"
            )
    if run.get("idea_count") != len(ideas):
        errors.append(f"{slug}: idea_count does not match idea manifests")
    if run.get("schema_version") == "ResearchRunManifestV1" and run.get("report_count") != len(run.get("report_refs", [])):
        errors.append(f"{slug}: report_count does not match PDF report_refs")
    if run.get("reviewed_idea_count") != computed["reviewed_count"]:
        errors.append(f"{slug}: reviewed_idea_count does not reconcile with lifecycle records")
    retained = sum(
        idea.get("lifecycle_status") in RETAINED_LIFECYCLES for idea in ideas
    )
    if run.get("retained_idea_count") != retained:
        errors.append(f"{slug}: retained_idea_count does not reconcile with lifecycle records")

    idea_ids = {idea.get("idea_id") for idea in ideas}
    comparisons = run.get("pairwise_comparisons", [])
    for comparison in comparisons:
        if comparison.get("idea_a_id") not in idea_ids or comparison.get("idea_b_id") not in idea_ids:
            errors.append(f"{slug}: pairwise comparison references an unknown idea")
    if computed["arena_entrant_count"] >= 6 and not comparisons:
        errors.append(f"{slug}: six or more Arena entrants require pairwise comparison records")

    if run.get("run_mode") == "DISCOVERY_PORTFOLIO_RUN":
        if run.get("status") == "DONE" and computed["independent_generation_count"] < 12:
            errors.append(f"{slug}: completed discovery run has fewer than 12 independent attempts")
        if (
            computed["natural_family_count"] < 8
            and run.get("status") in {"BLOCKED", "ARCHIVED"}
            and run.get("terminal_state") != "INSUFFICIENT_PORTFOLIO_BREADTH"
        ):
            errors.append(f"{slug}: low-breadth discovery run must emit INSUFFICIENT_PORTFOLIO_BREADTH")
    if run.get("run_mode") == "FOCUSED_DECISION_RUN":
        reader_text = " ".join(
            str(run.get(field, ""))
            for field in ("title", "subtitle", "summary", "scientific_decision")
        )
        if re.search(r"\b(?:tournament|arena[- ]selected|top-?1)\b", reader_text, re.IGNORECASE):
            errors.append(f"{slug}: focused run is mislabeled as an Arena tournament")

    for idea in ideas:
        if idea.get("has_fatal_flaw") and (
            idea.get("featured") or idea.get("lifecycle_status") == "FINALIST"
        ):
            errors.append(f"{slug}/{idea.get('slug')}: fatal flaw blocks featured/finalist status")

    lineage = run.get("source_lineage")
    if isinstance(lineage, dict):
        expected = {
            "generated_count": computed["raw_generation_count"],
            "natural_family_count": computed["natural_family_count"],
            "arena_entrant_count": computed["arena_entrant_count"],
            "match_count": len(comparisons),
            "finalist_count": computed["finalist_count"],
            "terminal_state": run.get("terminal_state"),
        }
        for field, value in expected.items():
            if lineage.get(field) != value:
                errors.append(f"{slug}: source_lineage.{field} does not match this run")


def validate_content(portal_root: Path, public_build: bool | None = None) -> dict[str, Any]:
    portal_root = portal_root.resolve()
    schema_root = portal_root / "schemas"
    content_root = portal_root / "content" / "runs"
    errors: list[str] = []
    warnings: list[str] = []
    findings: list[dict[str, str]] = []
    reconciliations: list[dict[str, Any]] = []
    if not content_root.exists():
        return {
            "status": "FAIL",
            "errors": ["content/runs is missing"],
            "warnings": warnings,
            "findings": findings,
        }
    visibility = _load_json(portal_root / "deploy" / "site_visibility.json")
    _validate_visibility(visibility, errors)
    if public_build is None:
        public_build = (
            visibility.get("mode") == "PUBLIC_SANITIZED"
            and visibility.get("public_release_approved") is True
        )

    index_path = content_root / "index.json"
    index = _load_json(index_path)
    raw_slugs = index.get("runs")
    if not isinstance(raw_slugs, list) or not all(isinstance(item, str) for item in raw_slugs):
        errors.append("content/runs/index.json runs must be an array of strings")
        raw_slugs = []
    slugs: list[str] = raw_slugs
    if len(slugs) != len(set(slugs)):
        errors.append("content/runs/index.json contains duplicate run slugs")
    actual_dirs = {item.name for item in content_root.iterdir() if item.is_dir()}
    for orphan in sorted(actual_dirs - set(slugs)):
        errors.append(f"Unindexed run bundle is not allowed: {orphan}")

    expected_public: set[str] = set()
    for slug in slugs:
        try:
            safe_slug = _safe_relative(slug)
            if len(safe_slug.parts) != 1:
                raise PublicationError(f"Unsafe run slug: {slug}")
        except PublicationError as exc:
            errors.append(str(exc))
            continue
        run_root = content_root / slug
        run_path = run_root / "run.json"
        if not run_path.is_file():
            errors.append(f"{slug}: run.json is missing")
            continue
        run = _load_json(run_path)
        run_schema = "research-run-manifest-v2.schema.json" if run.get("schema_version") == "ResearchRunManifestV2" else "research-run-manifest-v1.schema.json"
        errors.extend(_validate_against_schema(run_path, schema_root / run_schema))
        if run.get("slug") != slug:
            errors.append(f"{run_path}: slug does not match directory")
        if public_build and run.get("visibility") != "PUBLIC_SANITIZED":
            errors.append(f"{slug}: non-public run included in public build")
        if public_build and run.get("run_id") not in visibility.get("approved_run_ids", []):
            errors.append(f"{slug}: run is not approved by deploy/site_visibility.json")

        allowed_content = {"run.json", *PUBLICATION_OUTPUTS}
        source_records: list[dict[str, Any]] = []
        source_ledger_records: list[dict[str, Any]] = []
        source_index_path = run_root / "literature" / "index.json"
        if source_index_path.is_file():
            allowed_content.add("literature/index.json")
            source_index = _load_json(source_index_path)
            if source_index.get("schema_version") != "ResearchSourceIndexV1":
                errors.append(f"{slug}: unsupported literature index schema")
            if source_index.get("run_id") != run.get("run_id"):
                errors.append(f"{slug}: literature index run_id mismatch")
            raw_sources = source_index.get("sources")
            if not isinstance(raw_sources, list):
                errors.append(f"{slug}: literature index sources must be an array")
            else:
                source_records = [item for item in raw_sources if isinstance(item, dict)]
                if len(source_records) != len(raw_sources):
                    errors.append(f"{slug}: literature index contains a non-object source")
                for index, source in enumerate(source_records):
                    errors.extend(
                        _validate_value_against_schema(
                            source,
                            f"{source_index_path}#/sources/{index}",
                            schema_root / "research-source-manifest-v1.schema.json",
                        )
                    )
        source_ledger_path = run_root / "literature" / "run-source-ledger.json"
        if source_ledger_path.is_file():
            allowed_content.add("literature/run-source-ledger.json")
            errors.extend(
                _validate_against_schema(
                    source_ledger_path,
                    schema_root / "run-source-ledger-v1.schema.json",
                )
            )
            source_ledger = _load_json(source_ledger_path)
            if source_ledger.get("run_id") != run.get("run_id"):
                errors.append(f"{slug}: run source ledger run_id mismatch")
            raw_ledger_sources = source_ledger.get("sources")
            if isinstance(raw_ledger_sources, list):
                source_ledger_records = [
                    item for item in raw_ledger_sources if isinstance(item, dict)
                ]
                if len(source_ledger_records) != len(raw_ledger_sources):
                    errors.append(f"{slug}: run source ledger contains a non-object source")
                if source_ledger.get("source_count") != len(source_ledger_records):
                    errors.append(f"{slug}: run source ledger source_count mismatch")
            else:
                errors.append(f"{slug}: run source ledger sources must be an array")
        manifest_paths: dict[str, set[str]] = {}
        for manifest_relative, ref_field in ARTIFACT_MANIFESTS.items():
            manifest_path = run_root / manifest_relative
            allowed_content.add(manifest_relative)
            if not manifest_path.is_file():
                errors.append(f"{slug}: missing {manifest_relative}")
                manifest_paths[ref_field] = set()
                continue
            errors.extend(
                _validate_against_schema(
                    manifest_path,
                    schema_root / "research-artifact-manifest-v1.schema.json",
                )
            )
            manifest = _load_json(manifest_path)
            if manifest.get("run_id") != run.get("run_id"):
                errors.append(f"{slug}: {manifest_relative} run_id mismatch")
            paths = {
                item.get("path", "")
                for item in manifest.get("artifacts", [])
                if item.get("approved") is True
            }
            manifest_paths[ref_field] = paths
            for item in manifest.get("artifacts", []):
                if item.get("approved") is not True:
                    errors.append(f"{slug}: unapproved artifact listed in {manifest_relative}")
                if run.get("schema_version") == "ResearchRunManifestV2" and item.get("approved") is True:
                    try:
                        candidate, public_relative = _artifact_location(portal_root, run_root, item.get("path", ""))
                        if public_relative:
                            expected_public.add(public_relative)
                            if item.get("kind") == "PDF":
                                allowed_content.add(f"reports/{PurePosixPath(public_relative).name}")
                        elif candidate is not None:
                            allowed_content.add(candidate.relative_to(run_root).as_posix())
                        if candidate is not None and not candidate.exists():
                            label = (
                                "missing PDF"
                                if item.get("kind") == "PDF"
                                else "missing approved artifact"
                            )
                            errors.append(f"{slug}: {label} {item.get('path', '')}")
                    except (PublicationError, ValueError) as exc:
                        errors.append(f"{slug}: {exc}")

        idea_pdf_paths: set[str] = set()
        idea_records: list[dict[str, Any]] = []
        for idea_slug in run.get("idea_refs", []):
            idea_path = run_root / "ideas" / f"{idea_slug}.json"
            allowed_content.add(f"ideas/{idea_slug}.json")
            if not idea_path.exists():
                errors.append(f"{slug}: missing idea manifest {idea_slug}")
                continue
            idea = _load_json(idea_path)
            idea_schema = "research-idea-manifest-v2.schema.json" if idea.get("schema_version") == "ResearchIdeaManifestV2" else "research-idea-manifest-v1.schema.json"
            errors.extend(_validate_against_schema(idea_path, schema_root / idea_schema))
            idea_records.append(idea)
            if idea.get("slug") != idea_slug:
                errors.append(f"{slug}/{idea_slug}: idea slug mismatch")
            languages = set(idea.get("language_variants", {}))
            pdf_languages = set(idea.get("report_pdf", {}))
            markdown_languages = set(idea.get("report_markdown", {}))
            if idea.get("schema_version") == "ResearchIdeaManifestV1" and (not pdf_languages.issubset(languages) or not markdown_languages.issubset(languages)):
                errors.append(f"{slug}/{idea_slug}: report language is absent from language_variants")
            for relative in idea.get("report_markdown", {}).values():
                try:
                    candidate, _ = _artifact_location(portal_root, run_root, relative)
                    allowed_content.add(_safe_relative(relative).as_posix())
                    if candidate is not None and not candidate.exists():
                        errors.append(f"{slug}/{idea_slug}: missing Markdown {relative}")
                except PublicationError as exc:
                    errors.append(f"{slug}/{idea_slug}: {exc}")
            for relative in idea.get("report_pdf", {}).values():
                idea_pdf_paths.add(relative)
                try:
                    candidate, public_relative = _artifact_location(
                        portal_root, run_root, relative
                    )
                    if public_relative:
                        expected_public.add(public_relative)
                        allowed_content.add(f"reports/{PurePosixPath(public_relative).name}")
                    elif not urlparse(relative).scheme:
                        allowed_content.add(_safe_relative(relative).as_posix())
                    if candidate is not None and not candidate.exists():
                        errors.append(f"{slug}/{idea_slug}: missing PDF {relative}")
                except PublicationError as exc:
                    errors.append(f"{slug}/{idea_slug}: {exc}")
        missing_manifest_pdfs = idea_pdf_paths - manifest_paths.get("report_refs", set())
        for relative in sorted(missing_manifest_pdfs):
            errors.append(f"{slug}: idea PDF absent from report manifest: {relative}")

        if run.get("schema_version") == "ResearchRunManifestV2":
            report_ids = {report.get("report_id") for report in run.get("reports", [])}
            for field in ("primary_report_id", "primary_knowledge_id", "primary_summary_id", "run_specification_id"):
                if run.get(field) not in report_ids:
                    errors.append(f"{slug}: {field} references an unknown report")
            for report in run.get("reports", []):
                for field in ("path", "markdown_path"):
                    relative = report.get(field)
                    if not relative:
                        continue
                    try:
                        candidate, public_relative = _artifact_location(portal_root, run_root, relative)
                        if public_relative:
                            expected_public.add(public_relative)
                            allowed_content.add(f"reports/{PurePosixPath(public_relative).name}")
                        elif candidate is not None:
                            allowed_content.add(candidate.relative_to(run_root).as_posix())
                        if candidate is not None and not candidate.exists():
                            errors.append(f"{slug}: missing report artifact {relative}")
                    except (PublicationError, ValueError) as exc:
                        errors.append(f"{slug}: {exc}")
            for relative in run.get("historical_fixture_paths", []):
                try:
                    candidate, _ = _artifact_location(portal_root, run_root, relative)
                    if candidate is not None:
                        allowed_content.add(candidate.relative_to(run_root).as_posix())
                    if candidate is not None and not candidate.exists():
                        errors.append(f"{slug}: missing historical fixture {relative}")
                except (PublicationError, ValueError) as exc:
                    errors.append(f"{slug}: {exc}")

            source_ids = [source.get("source_id") for source in source_records]
            if len(source_ids) != len(set(source_ids)):
                errors.append(f"{slug}: literature index contains duplicate source_id values")
            dois = [
                source.get("doi", "").strip().lower()
                for source in source_records
                if isinstance(source.get("doi"), str) and source.get("doi", "").strip()
            ]
            if len(dois) != len(set(dois)):
                errors.append(f"{slug}: literature index contains duplicate DOI values")
            unique_cited = run.get("literature_stats", {}).get("unique_cited_sources")
            cited_source_count = sum(
                bool(source.get("cited_in_reports")) for source in source_records
            )
            if unique_cited is not None and unique_cited != cited_source_count:
                errors.append(f"{slug}: unique_cited_sources does not match source records")
            analyzed_unique_total = run.get("literature_stats", {}).get(
                "analyzed_unique_total"
            )
            if source_ledger_records:
                indexed_ids = {source.get("source_id") for source in source_records}
                ledger_ids = {source.get("source_id") for source in source_ledger_records}
                if indexed_ids != ledger_ids:
                    errors.append(f"{slug}: run source ledger and literature index differ")
                derived_analyzed_total = derive_analyzed_unique_total_from_ledger(
                    source_ledger_records
                )
                derived_unique_cited = _unique_ledger_count(
                    source_ledger_records, "final_report_cited"
                )
                derived_load_bearing = _unique_ledger_count(
                    source_ledger_records, "load_bearing"
                )
            else:
                derived_analyzed_total = derive_analyzed_unique_total(source_records)
                derived_unique_cited = cited_source_count
                derived_load_bearing = sum(
                    1 for source in source_records if source.get("load_bearing") is True
                )

            literature_scope_enabled = run.get("literature_scope_enabled", True)
            completed_real_run = (
                run.get("status") == "DONE"
                and run.get("publication_status") == "APPROVED"
                and run.get("source_type") != "SYNTHETIC_DEMO"
            )
            if completed_real_run and literature_scope_enabled and not source_ledger_records:
                errors.append(
                    f"{slug}: completed literature-enabled run requires RunSourceLedgerV1"
                )
            if completed_real_run and literature_scope_enabled and analyzed_unique_total is None:
                errors.append(
                    f"{slug}: completed literature-enabled run requires analyzed_unique_total"
                )
            if analyzed_unique_total is not None and derived_analyzed_total is None:
                errors.append(
                    f"{slug}: analyzed_unique_total requires a complete staged source ledger"
                )
            elif (
                analyzed_unique_total is not None
                and derived_analyzed_total is not None
                and analyzed_unique_total != derived_analyzed_total
            ):
                errors.append(
                    f"{slug}: analyzed_unique_total does not match staged source records"
                )
            declared_load_bearing = run.get("literature_stats", {}).get(
                "load_bearing_sources"
            )
            load_bearing_count = sum(
                1 for source in source_records if source.get("load_bearing") is True
            )
            if (
                analyzed_unique_total is not None
                and declared_load_bearing is not None
                and declared_load_bearing != load_bearing_count
            ):
                errors.append(f"{slug}: load_bearing_sources does not match source records")
            declared_report_references = run.get("literature_stats", {}).get(
                "report_reference_count"
            )
            report_reference_count = sum(
                len(citation.get("citation_numbers", []))
                for source in source_records
                for citation in source.get("cited_in_reports", [])
            )
            if (
                analyzed_unique_total is not None
                and declared_report_references is not None
                and declared_report_references != report_reference_count
            ):
                errors.append(
                    f"{slug}: report_reference_count does not match citation map entries"
                )
            if (
                source_ledger_records
                and unique_cited is not None
                and unique_cited != derived_unique_cited
            ):
                errors.append(
                    f"{slug}: unique_cited_sources does not match RunSourceLedgerV1"
                )
            if (
                source_ledger_records
                and declared_load_bearing is not None
                and declared_load_bearing != derived_load_bearing
            ):
                errors.append(
                    f"{slug}: load_bearing_sources does not match RunSourceLedgerV1"
                )
            reconciliations.append(
                {
                    "run_id": run.get("run_id"),
                    "slug": slug,
                    "literature_scope_enabled": literature_scope_enabled,
                    "status": run.get("status"),
                    "ledger_present": bool(source_ledger_records),
                    "declared": {
                        "analyzed_unique_total": analyzed_unique_total,
                        "unique_cited_sources": unique_cited,
                        "load_bearing_sources": declared_load_bearing,
                        "report_reference_count": declared_report_references,
                    },
                    "derived": {
                        "analyzed_unique_total": derived_analyzed_total,
                        "unique_cited_sources": derived_unique_cited,
                        "load_bearing_sources": derived_load_bearing,
                        "report_reference_count": report_reference_count,
                    },
                    "reconciled": (
                        analyzed_unique_total == derived_analyzed_total
                        and (unique_cited is None or unique_cited == derived_unique_cited)
                        and (
                            declared_load_bearing is None
                            or declared_load_bearing == derived_load_bearing
                        )
                        and (
                            declared_report_references is None
                            or declared_report_references == report_reference_count
                        )
                    ),
                }
            )
            report_ids = {report.get("report_id") for report in run.get("reports", [])}
            idea_ids = {idea.get("idea_id") for idea in idea_records}
            citation_map: dict[str, set[int]] = {}
            for source in source_records:
                for idea_id in source.get("related_idea_ids", []):
                    if idea_id not in idea_ids:
                        errors.append(f"{slug}: source references unknown idea {idea_id}")
                for report_id in source.get("related_report_ids", []):
                    if report_id not in report_ids:
                        errors.append(f"{slug}: source references unknown report {report_id}")
                for citation in source.get("cited_in_reports", []):
                    report_id = citation.get("report_id")
                    if report_id not in report_ids:
                        errors.append(f"{slug}: citation references unknown report {report_id}")
                    citation_map.setdefault(report_id, set()).update(
                        citation.get("citation_numbers", [])
                    )
            for report in run.get("reports", []):
                markdown_path = report.get("markdown_path")
                if not markdown_path:
                    continue
                try:
                    markdown_file, _ = _artifact_location(
                        portal_root, run_root, markdown_path
                    )
                    if markdown_file is None or not markdown_file.exists():
                        continue
                    unresolved = _citation_numbers(
                        markdown_file.read_text(encoding="utf-8")
                    ) - citation_map.get(report.get("report_id"), set())
                    if unresolved:
                        values = ", ".join(map(str, sorted(unresolved)))
                        errors.append(
                            f"{slug}: report {report.get('report_id')} has unresolved citations: {values}"
                        )
                except PublicationError as exc:
                    errors.append(f"{slug}: {exc}")

        _validate_portfolio(slug, run, idea_records, errors)
        ids: set[str] = set()
        for field in ("report_refs", "knowledge_refs", "artifact_refs"):
            for artifact in run.get(field, []):
                artifact_id = artifact.get("id", "")
                if artifact_id in ids:
                    errors.append(f"{slug}: duplicate artifact id {artifact_id}")
                ids.add(artifact_id)
                artifact_path = artifact.get("path", "")
                if artifact_path not in manifest_paths.get(field, set()):
                    errors.append(f"{slug}: {artifact_path} absent from {field} manifest")
                try:
                    candidate, public_relative = _artifact_location(
                        portal_root, run_root, artifact_path
                    )
                    if public_relative:
                        expected_public.add(public_relative)
                        if artifact.get("kind") == "PDF":
                            allowed_content.add(
                                f"reports/{PurePosixPath(public_relative).name}"
                            )
                    elif not urlparse(artifact_path).scheme:
                        allowed_content.add(_safe_relative(artifact_path).as_posix())
                    if candidate is not None and not candidate.exists():
                        errors.append(f"{slug}: missing approved artifact {artifact_path}")
                except PublicationError as exc:
                    errors.append(f"{slug}: {exc}")

        for file_path in run_root.rglob("*"):
            if not file_path.is_file():
                continue
            relative = file_path.relative_to(run_root).as_posix()
            if relative.startswith("thumbnails/") and file_path.suffix.lower() == ".webp":
                allowed_content.add(relative)
            if relative not in allowed_content:
                errors.append(f"{slug}: unmanifested content file {relative}")
            findings.extend(_scan_file(file_path))

    public_root = portal_root / "public"
    artifact_root = public_root / "artifacts"
    if artifact_root.exists():
        actual_public = {
            item.relative_to(public_root).as_posix()
            for item in artifact_root.rglob("*")
            if item.is_file()
        }
        for orphan in sorted(actual_public - expected_public):
            errors.append(f"Unreferenced public artifact is not allowed: {orphan}")
    if public_root.exists():
        for file_path in public_root.rglob("*"):
            if file_path.is_file():
                findings.extend(_scan_file(file_path))
    for finding in findings:
        errors.append(
            f"Sanitization finding [{finding['category']}] in {finding['file']}: redacted"
        )
    _write_json(
        portal_root / ".publication-staging" / "literature_count_reconciliation.json",
        {
            "schema_version": "LiteratureCountReconciliationV1",
            "status": "PASS" if not errors else "FAIL",
            "runs": reconciliations,
        },
    )
    return {
        "status": "PASS" if not errors else "FAIL",
        "run_count": len(slugs),
        "errors": errors,
        "warnings": warnings,
        "findings": findings,
        "public_build": public_build,
    }


def rebuild_index(portal_root: Path) -> dict[str, Any]:
    content_root = portal_root.resolve() / "content" / "runs"
    runs: list[dict[str, Any]] = []
    for run_path in sorted(content_root.glob("*/run.json")):
        run = _load_json(run_path)
        runs.append({"slug": run["slug"], "updated_at": run["updated_at"]})
    runs.sort(key=lambda item: (item["updated_at"], item["slug"]), reverse=True)
    payload = {
        "schema_version": "ResearchRunIndexV1",
        "generated_at": "1970-01-01T00:00:00Z",
        "runs": [item["slug"] for item in runs],
    }
    _write_json(content_root / "index.json", payload)
    return payload


def _thumbnail(pdf_path: Path, target: Path) -> bool:
    try:
        import fitz

        with fitz.open(pdf_path) as document:
            page = document[0]
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.1, 1.1), alpha=False)
            target.parent.mkdir(parents=True, exist_ok=True)
            pixmap.save(target)
        return True
    except Exception:
        return False


def _replace_tree(new_root: Path, target: Path, backup: Path) -> None:
    if target.exists():
        shutil.move(str(target), str(backup))
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(new_root), str(target))


def publish_run(run_root: Path, portal_root: Path, visibility: str) -> dict[str, Any]:
    run_root = run_root.resolve()
    portal_root = portal_root.resolve()
    if visibility not in {"PRIVATE", "LAB_INTERNAL", "PUBLIC_SANITIZED"}:
        raise PublicationError(f"Unsupported visibility: {visibility}")
    allowlist_path = run_root / "publication-allowlist.json"
    if not allowlist_path.exists():
        raise PublicationError("publication-allowlist.json is required")
    schema_root = portal_root / "schemas"
    errors = _validate_against_schema(
        allowlist_path, schema_root / "publication-allowlist-v1.schema.json"
    )
    if errors:
        raise PublicationError("Invalid publication allowlist:\n" + "\n".join(errors))
    allowlist = _load_json(allowlist_path)
    if allowlist["visibility"] != visibility:
        raise PublicationError("Requested visibility does not match the allowlist")
    if "run.json" not in allowlist["approved_artifacts"]:
        raise PublicationError("run.json must be explicitly allowlisted")

    source_run_path = _source_file(run_root, _safe_relative("run.json"))
    source_run = _load_json(source_run_path)
    run_schema = (
        "research-run-manifest-v2.schema.json"
        if source_run.get("schema_version") == "ResearchRunManifestV2"
        else "research-run-manifest-v1.schema.json"
    )
    manifest_errors = _validate_against_schema(source_run_path, schema_root / run_schema)
    if manifest_errors:
        raise PublicationError("Invalid source run manifest:\n" + "\n".join(manifest_errors))
    if allowlist["run_id"] != source_run["run_id"]:
        raise PublicationError("Publication allowlist run_id does not match run.json")
    if visibility == "PUBLIC_SANITIZED" and source_run["visibility"] != "PUBLIC_SANITIZED":
        raise PublicationError(
            "Only PUBLIC_SANITIZED source manifests may be publicly published"
        )

    slug = source_run["slug"]
    target_root = portal_root / "content" / "runs" / slug
    public_root = portal_root / "public" / "artifacts" / slug
    staging = portal_root / ".publication-staging" / slug
    if staging.exists():
        shutil.rmtree(staging)
    content_stage = staging / "content"
    public_stage = staging / "public"
    content_stage.mkdir(parents=True)
    public_stage.mkdir(parents=True)
    source_before = _tree_hash(run_root)
    denied_patterns = [
        re.compile(pattern, re.IGNORECASE)
        for pattern in allowlist.get("denied_patterns", [])
    ]

    copied_relatives: list[str] = []
    for raw_relative in allowlist["approved_artifacts"]:
        relative = _safe_relative(raw_relative)
        if any(pattern.search(relative.as_posix()) for pattern in denied_patterns):
            raise PublicationError(
                f"Allowlisted artifact matches a denied pattern: {relative}"
            )
        source = _source_file(run_root, relative)
        destination = content_stage.joinpath(*relative.parts)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        copied_relatives.append(relative.as_posix())

    findings = [
        finding
        for file_path in content_stage.rglob("*")
        if file_path.is_file()
        for finding in _scan_file(file_path)
    ]
    if findings:
        raise PublicationError("Sanitization findings prevent publication; details redacted")
    run_manifest = _load_json(content_stage / "run.json")
    run_manifest["visibility"] = visibility
    source_index_path = content_stage / "literature" / "index.json"
    source_ledger_path = content_stage / "literature" / "run-source-ledger.json"
    analyzed_unique_total = run_manifest.get("literature_stats", {}).get(
        "analyzed_unique_total"
    )
    if analyzed_unique_total is None and (
        source_ledger_path.is_file() or source_index_path.is_file()
    ):
        source_document = _load_json(
            source_ledger_path if source_ledger_path.is_file() else source_index_path
        )
        sources = source_document.get("sources", [])
        if isinstance(sources, list):
            source_records = [source for source in sources if isinstance(source, dict)]
            derived_total = (
                derive_analyzed_unique_total_from_ledger(source_records)
                if source_ledger_path.is_file()
                else derive_analyzed_unique_total(source_records)
            )
            if derived_total is not None:
                run_manifest["literature_stats"]["analyzed_unique_total"] = derived_total
    _write_json(content_stage / "run.json", run_manifest)

    expected_public_paths: set[str] = set()
    for field in ("report_refs", "knowledge_refs", "artifact_refs"):
        for artifact in run_manifest.get(field, []):
            value = artifact.get("path", "")
            if value.startswith(f"/artifacts/{slug}/"):
                expected_public_paths.add(value.removeprefix(f"/artifacts/{slug}/"))
    if run_manifest.get("schema_version") == "ResearchRunManifestV2":
        for report in run_manifest.get("reports", []):
            value = report.get("path")
            if isinstance(value, str) and value.startswith(f"/artifacts/{slug}/"):
                expected_public_paths.add(value.removeprefix(f"/artifacts/{slug}/"))
    for manifest_relative in ARTIFACT_MANIFESTS:
        manifest_path = content_stage / manifest_relative
        if not manifest_path.is_file():
            continue
        manifest = _load_json(manifest_path)
        for artifact in manifest.get("artifacts", []):
            value = artifact.get("path", "")
            if artifact.get("approved") is True and value.startswith(
                f"/artifacts/{slug}/"
            ):
                expected_public_paths.add(value.removeprefix(f"/artifacts/{slug}/"))
    for idea_path in content_stage.glob("ideas/*.json"):
        idea = _load_json(idea_path)
        for value in idea.get("report_pdf", {}).values():
            if value.startswith(f"/artifacts/{slug}/"):
                expected_public_paths.add(value.removeprefix(f"/artifacts/{slug}/"))

    pdf_by_name: dict[str, Path] = {}
    for pdf in content_stage.rglob("*.pdf"):
        if pdf.name in pdf_by_name:
            raise PublicationError(f"Duplicate PDF filename in publication bundle: {pdf.name}")
        pdf_by_name[pdf.name] = pdf
    for relative in sorted(expected_public_paths):
        safe = _safe_relative(relative)
        if len(safe.parts) != 1 or safe.suffix.lower() != ".pdf":
            raise PublicationError(f"Public artifact path must be a PDF filename: {relative}")
        source = pdf_by_name.get(safe.name)
        if source is None:
            raise PublicationError(f"Public PDF is missing from allowlisted bundle: {relative}")
        shutil.copy2(source, public_stage / safe.name)

    thumbnail_created = False
    if pdf_by_name:
        first_pdf = pdf_by_name[sorted(pdf_by_name)[0]]
        thumbnail_created = _thumbnail(
            first_pdf, content_stage / "thumbnails" / "report-first-page.webp"
        )
    source_after = _tree_hash(run_root)
    if source_before != source_after:
        raise PublicationError("Source run was mutated during publication")

    copied = [
        CopiedArtifact(
            relative,
            _sha256(content_stage / Path(*_safe_relative(relative).parts)),
            (content_stage / Path(*_safe_relative(relative).parts)).stat().st_size,
        )
        for relative in copied_relatives
    ]
    receipt = {
        "schema_version": "PublicationReceiptV1",
        "run_id": run_manifest["run_id"],
        "slug": slug,
        "visibility": visibility,
        "published_at": allowlist["approved_at"],
        "source_tree_hash_before": source_before,
        "source_tree_hash_after": source_after,
        "source_unchanged": True,
        "copied_artifact_count": len(copied),
        "thumbnail_created": thumbnail_created,
    }
    _write_json(content_stage / "PUBLICATION_RECEIPT.json", receipt)
    _write_json(
        content_stage / "PUBLICATION_CONTENT_HASHES.json",
        {
            item.relative_path: {
                "sha256": item.sha256,
                "size_bytes": item.size_bytes,
            }
            for item in copied
        },
    )
    _write_json(
        content_stage / "SANITIZATION_AUDIT.json",
        {
            "status": "PASS",
            "findings": [],
            "rules": [
                "allowlist only",
                "no path traversal or symlinks",
                "no absolute paths or secret patterns",
                "no stale public artifacts",
                "source unchanged",
            ],
        },
    )
    (content_stage / "PUBLICATION_DIFF.md").write_text(
        "# Publication diff\n\nOnly explicitly allowlisted artifacts were copied. "
        "The source run tree remained unchanged.\n\n"
        + "\n".join(f"- `{item.relative_path}`" for item in copied)
        + "\n",
        encoding="utf-8",
    )

    backup_content = staging / "backup-content"
    backup_public = staging / "backup-public"
    index_path = portal_root / "content" / "runs" / "index.json"
    index_before = index_path.read_bytes() if index_path.exists() else None
    try:
        _replace_tree(content_stage, target_root, backup_content)
        _replace_tree(public_stage, public_root, backup_public)
        rebuild_index(portal_root)
        validation = validate_content(portal_root)
        if validation["status"] != "PASS":
            raise PublicationError(
                "Published bundle failed portal validation:\n"
                + "\n".join(validation["errors"])
            )
    except Exception:
        if target_root.exists():
            shutil.rmtree(target_root)
        if backup_content.exists():
            shutil.move(str(backup_content), str(target_root))
        if public_root.exists():
            shutil.rmtree(public_root)
        if backup_public.exists():
            shutil.move(str(backup_public), str(public_root))
        if index_before is None:
            index_path.unlink(missing_ok=True)
        else:
            index_path.write_bytes(index_before)
        raise
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return receipt


def asset_budget(portal_root: Path) -> dict[str, Any]:
    root = portal_root.resolve() / "out"
    if not root.exists():
        raise PublicationError("out/ does not exist; build the static site first")
    files = [item for item in root.rglob("*") if item.is_file()]
    total = sum(item.stat().st_size for item in files)
    pdf_warnings = [
        item.relative_to(root).as_posix()
        for item in files
        if item.suffix.lower() == ".pdf" and item.stat().st_size > 25 * 1024 * 1024
    ]
    status = (
        "BLOCK"
        if total > 900 * 1024 * 1024
        else "WARN"
        if total > 750 * 1024 * 1024
        else "PASS"
    )
    return {
        "status": status,
        "site_size_bytes": total,
        "pdf_warnings": pdf_warnings,
    }
