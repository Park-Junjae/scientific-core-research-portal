from __future__ import annotations

import hashlib
import json
import re
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Iterable

from jsonschema import Draft202012Validator, FormatChecker


ABSOLUTE_PATH = re.compile(r"(?:[A-Za-z]:[\\/]|/home/|/Users/|/private/var/)", re.IGNORECASE)
SECRET_PATTERN = re.compile(
    r"(?:sk-(?:proj-)?[A-Za-z0-9_-]{16,}|OPENAI_API_KEY|ANTHROPIC_API_KEY|BEGIN (?:RSA|OPENSSH) PRIVATE KEY)",
    re.IGNORECASE,
)
RAW_PRIVATE_PATTERN = re.compile(r"(?:provider[_-]raw|raw[_-]response|private[_-]prompt|registry\.jsonl|receipt[_-]raw)", re.IGNORECASE)
ALLOWED_TEXT = {".json", ".md", ".csv", ".txt", ".yaml", ".yml"}


class PublicationError(RuntimeError):
    """Raised when a publication boundary or content contract fails."""


@dataclass(frozen=True)
class CopiedArtifact:
    relative_path: str
    sha256: str
    size_bytes: int


def _load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PublicationError(f"Cannot read JSON: {path}: {exc}") from exc


def _write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _tree_hash(root: Path) -> str:
    digest = hashlib.sha256()
    for file_path in sorted(item for item in root.rglob("*") if item.is_file()):
        digest.update(file_path.relative_to(root).as_posix().encode())
        digest.update(_sha256(file_path).encode())
    return digest.hexdigest()


def _safe_relative(value: str) -> PurePosixPath:
    normalized = value.replace("\\", "/")
    path = PurePosixPath(normalized)
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise PublicationError(f"Unsafe artifact path: {value}")
    return path


def _validate_against_schema(instance_path: Path, schema_path: Path) -> list[str]:
    instance = _load_json(instance_path)
    schema = _load_json(schema_path)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    return [f"{instance_path}: {'/'.join(map(str, error.absolute_path)) or '<root>'}: {error.message}" for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path))]


def _scan_text(path: Path) -> list[dict[str, str]]:
    if path.suffix.lower() not in ALLOWED_TEXT:
        return []
    text = path.read_text(encoding="utf-8", errors="replace")
    findings: list[dict[str, str]] = []
    for category, pattern in (("absolute_path", ABSOLUTE_PATH), ("secret", SECRET_PATTERN), ("private_artifact", RAW_PRIVATE_PATTERN)):
        match = pattern.search(text)
        if match:
            findings.append({"file": path.as_posix(), "category": category, "evidence": match.group(0)[:80]})
    return findings


def validate_content(portal_root: Path, public_build: bool | None = None) -> dict[str, Any]:
    portal_root = portal_root.resolve()
    schema_root = portal_root / "schemas"
    content_root = portal_root / "content" / "runs"
    visibility = _load_json(portal_root / "deploy" / "site_visibility.json")
    if public_build is None:
        public_build = visibility.get("mode") == "PUBLIC_SANITIZED" and visibility.get("public_release_approved") is True
    errors: list[str] = []
    warnings: list[str] = []
    findings: list[dict[str, str]] = []
    if not content_root.exists():
        errors.append("content/runs is missing")
        return {"status": "FAIL", "errors": errors, "warnings": warnings, "findings": findings}
    index_path = content_root / "index.json"
    index = _load_json(index_path)
    slugs = index.get("runs", [])
    if len(slugs) != len(set(slugs)):
        errors.append("content/runs/index.json contains duplicate run slugs")
    for slug in slugs:
        run_root = content_root / slug
        run_path = run_root / "run.json"
        errors.extend(_validate_against_schema(run_path, schema_root / "research-run-manifest-v1.schema.json"))
        run = _load_json(run_path)
        if run.get("slug") != slug:
            errors.append(f"{run_path}: slug does not match directory")
        if public_build and run.get("visibility") != "PUBLIC_SANITIZED":
            errors.append(f"{slug}: non-public run included in public build")
        if public_build and run.get("run_id") not in visibility.get("approved_run_ids", []):
            errors.append(f"{slug}: run is not approved by deploy/site_visibility.json")
        for idea_slug in run.get("idea_refs", []):
            idea_path = run_root / "ideas" / f"{idea_slug}.json"
            if not idea_path.exists():
                errors.append(f"{slug}: missing idea manifest {idea_slug}")
                continue
            errors.extend(_validate_against_schema(idea_path, schema_root / "research-idea-manifest-v1.schema.json"))
            idea = _load_json(idea_path)
            for relative in idea.get("report_markdown", {}).values():
                candidate = run_root / _safe_relative(relative)
                if not candidate.exists():
                    errors.append(f"{slug}/{idea_slug}: missing Markdown {relative}")
        if run.get("idea_count") != len(run.get("idea_refs", [])):
            errors.append(f"{slug}: idea_count does not match idea_refs")
        for artifact in [*run.get("report_refs", []), *run.get("knowledge_refs", []), *run.get("artifact_refs", [])]:
            artifact_path = artifact.get("path", "")
            if artifact_path.startswith("/artifacts/"):
                candidate = portal_root / "public" / _safe_relative(artifact_path.lstrip("/"))
            else:
                candidate = run_root / _safe_relative(artifact_path)
            if not candidate.exists():
                errors.append(f"{slug}: missing approved artifact {artifact_path}")
        for file_path in run_root.rglob("*"):
            if file_path.is_file():
                findings.extend(_scan_text(file_path))
    for file_path in (portal_root / "public").rglob("*") if (portal_root / "public").exists() else []:
        if file_path.is_file():
            findings.extend(_scan_text(file_path))
    for finding in findings:
        errors.append(f"Sanitization finding [{finding['category']}] in {finding['file']}: {finding['evidence']}")
    if visibility.get("mode") == "LOCAL_ONLY" and visibility.get("public_release_approved"):
        errors.append("LOCAL_ONLY visibility cannot set public_release_approved=true")
    return {"status": "PASS" if not errors else "FAIL", "run_count": len(slugs), "errors": errors, "warnings": warnings, "findings": findings, "public_build": public_build}


def rebuild_index(portal_root: Path) -> dict[str, Any]:
    content_root = portal_root.resolve() / "content" / "runs"
    runs: list[dict[str, Any]] = []
    for run_path in sorted(content_root.glob("*/run.json")):
        run = _load_json(run_path)
        runs.append({"slug": run["slug"], "updated_at": run["updated_at"]})
    runs.sort(key=lambda item: (item["updated_at"], item["slug"]), reverse=True)
    payload = {"schema_version": "ResearchRunIndexV1", "generated_at": "1970-01-01T00:00:00Z", "runs": [item["slug"] for item in runs]}
    _write_json(content_root / "index.json", payload)
    return payload


def _thumbnail(pdf_path: Path, target: Path) -> bool:
    try:
        import fitz
        document = fitz.open(pdf_path)
        page = document[0]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.1, 1.1), alpha=False)
        target.parent.mkdir(parents=True, exist_ok=True)
        pixmap.save(target)
        document.close()
        return True
    except Exception:
        return False


def publish_run(run_root: Path, portal_root: Path, visibility: str) -> dict[str, Any]:
    run_root = run_root.resolve()
    portal_root = portal_root.resolve()
    if visibility not in {"PRIVATE", "LAB_INTERNAL", "PUBLIC_SANITIZED"}:
        raise PublicationError(f"Unsupported visibility: {visibility}")
    allowlist_path = run_root / "publication-allowlist.json"
    if not allowlist_path.exists():
        raise PublicationError("publication-allowlist.json is required")
    errors = _validate_against_schema(allowlist_path, portal_root / "schemas" / "publication-allowlist-v1.schema.json")
    if errors:
        raise PublicationError("Invalid publication allowlist:\n" + "\n".join(errors))
    allowlist = _load_json(allowlist_path)
    if allowlist["visibility"] != visibility:
        raise PublicationError("Requested visibility does not match the allowlist")
    if "run.json" not in allowlist["approved_artifacts"]:
        raise PublicationError("run.json must be explicitly allowlisted")
    source_run = _load_json(run_root / "run.json")
    if visibility == "PUBLIC_SANITIZED" and source_run.get("visibility") != "PUBLIC_SANITIZED":
        raise PublicationError("Only PUBLIC_SANITIZED source manifests may be publicly published")
    slug = source_run["slug"]
    target_root = portal_root / "content" / "runs" / slug
    staging = portal_root / ".publication-staging" / slug
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)
    source_before = _tree_hash(run_root)
    copied: list[CopiedArtifact] = []
    denied_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in allowlist.get("denied_patterns", [])]
    for raw_relative in allowlist["approved_artifacts"]:
        relative = _safe_relative(raw_relative)
        if any(pattern.search(relative.as_posix()) for pattern in denied_patterns):
            raise PublicationError(f"Allowlisted artifact matches a denied pattern: {relative}")
        source = run_root.joinpath(*relative.parts)
        if not source.is_file():
            raise PublicationError(f"Allowlisted artifact is missing: {relative}")
        destination = staging.joinpath(*relative.parts)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        copied.append(CopiedArtifact(relative.as_posix(), _sha256(destination), destination.stat().st_size))
    findings = [finding for file_path in staging.rglob("*") if file_path.is_file() for finding in _scan_text(file_path)]
    if findings:
        raise PublicationError(f"Sanitization findings prevent publication: {findings}")
    run_manifest = _load_json(staging / "run.json")
    run_manifest["visibility"] = visibility
    _write_json(staging / "run.json", run_manifest)
    if target_root.exists():
        shutil.rmtree(target_root)
    target_root.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(staging), str(target_root))
    public_root = portal_root / "public" / "artifacts" / slug
    public_root.mkdir(parents=True, exist_ok=True)
    thumbnail_created = False
    for pdf in target_root.rglob("*.pdf"):
        shutil.copy2(pdf, public_root / pdf.name)
        if not thumbnail_created:
            thumbnail_created = _thumbnail(pdf, target_root / "thumbnails" / "report-first-page.webp")
    rebuild_index(portal_root)
    source_after = _tree_hash(run_root)
    if source_before != source_after:
        raise PublicationError("Source run was mutated during publication")
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    receipt = {"schema_version": "PublicationReceiptV1", "run_id": run_manifest["run_id"], "slug": slug, "visibility": visibility, "published_at": now, "source_tree_hash_before": source_before, "source_tree_hash_after": source_after, "source_unchanged": True, "copied_artifact_count": len(copied), "thumbnail_created": thumbnail_created}
    _write_json(target_root / "PUBLICATION_RECEIPT.json", receipt)
    _write_json(target_root / "PUBLICATION_CONTENT_HASHES.json", {item.relative_path: {"sha256": item.sha256, "size_bytes": item.size_bytes} for item in copied})
    _write_json(target_root / "SANITIZATION_AUDIT.json", {"status": "PASS", "findings": [], "rules": ["no absolute paths", "no secret patterns", "allowlist only", "source unchanged"]})
    (target_root / "PUBLICATION_DIFF.md").write_text("# Publication diff\n\nOnly explicitly allowlisted artifacts were copied. The source run tree remained unchanged.\n\n" + "\n".join(f"- `{item.relative_path}`" for item in copied) + "\n", encoding="utf-8")
    return receipt


def asset_budget(portal_root: Path) -> dict[str, Any]:
    root = portal_root.resolve() / "out"
    if not root.exists():
        raise PublicationError("out/ does not exist; build the static site first")
    files = [item for item in root.rglob("*") if item.is_file()]
    total = sum(item.stat().st_size for item in files)
    pdf_warnings = [item.relative_to(root).as_posix() for item in files if item.suffix.lower() == ".pdf" and item.stat().st_size > 25 * 1024 * 1024]
    status = "BLOCK" if total > 900 * 1024 * 1024 else "WARN" if total > 750 * 1024 * 1024 else "PASS"
    return {"status": status, "site_size_bytes": total, "pdf_warnings": pdf_warnings}
