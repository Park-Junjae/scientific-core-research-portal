from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path

from coscientist.site import PublicationError, publish_run, validate_content
from coscientist.site.publisher import (
    _portfolio_counts,
    _validate_portfolio,
    derive_analyzed_unique_total,
    derive_analyzed_unique_total_from_ledger,
)


PORTAL = Path(__file__).resolve().parents[1]
DEMO_SLUG = "xrrna-prime-assembly-demo"


def tree_hash(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        digest.update(path.relative_to(root).as_posix().encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


def make_empty_portal(root: Path) -> Path:
    portal = root / "portal"
    shutil.copytree(PORTAL / "schemas", portal / "schemas")
    shutil.copytree(PORTAL / "deploy", portal / "deploy")
    (portal / "content" / "runs").mkdir(parents=True)
    (portal / "public" / "artifacts").mkdir(parents=True)
    (portal / "content" / "runs" / "index.json").write_text(
        json.dumps(
            {
                "schema_version": "ResearchRunIndexV1",
                "generated_at": "1970-01-01T00:00:00Z",
                "runs": [],
            }
        ),
        encoding="utf-8",
    )
    return portal


def make_source(root: Path) -> Path:
    source = root / "source"
    shutil.copytree(PORTAL / "content" / "runs" / DEMO_SLUG, source)
    for name in (
        "PUBLICATION_RECEIPT.json",
        "PUBLICATION_CONTENT_HASHES.json",
        "SANITIZATION_AUDIT.json",
        "PUBLICATION_DIFF.md",
    ):
        (source / name).unlink(missing_ok=True)
    shutil.rmtree(source / "thumbnails", ignore_errors=True)
    run = json.loads((source / "run.json").read_text(encoding="utf-8"))
    approved = sorted(
        path.relative_to(source).as_posix()
        for path in source.rglob("*")
        if path.is_file()
    )
    allowlist = {
        "schema_version": "PublicationAllowlistV1",
        "run_id": run["run_id"],
        "visibility": "PUBLIC_SANITIZED",
        "approved_artifacts": approved,
        "denied_patterns": ["provider", "registry"],
        "approved_by": "publication-test",
        "approved_at": "2026-07-21T00:00:00Z",
    }
    (source / "publication-allowlist.json").write_text(
        json.dumps(allowlist), encoding="utf-8"
    )
    return source


class PublicationCliTests(unittest.TestCase):
    def test_analyzed_literature_counts_a_paper_cited_by_two_reports_once(self) -> None:
        source = {
            "doi": "10.1000/example",
            "analysis_stage": "TITLE_ABSTRACT_SCREENED",
            "cited_in_reports": [{"report_id": "one"}, {"report_id": "two"}],
        }
        self.assertEqual(derive_analyzed_unique_total([source]), 1)

    def test_analyzed_literature_deduplicates_doi(self) -> None:
        sources = [
            {"doi": "https://doi.org/10.1000/EXAMPLE", "analysis_stage": "FULL_TEXT_REVIEWED"},
            {"doi": "10.1000/example", "analysis_stage": "DEEPLY_READ"},
        ]
        self.assertEqual(derive_analyzed_unique_total(sources), 1)

    def test_analyzed_literature_deduplicates_pmid(self) -> None:
        sources = [
            {"pmid": "PMID: 12345", "analysis_stage": "TITLE_ABSTRACT_SCREENED"},
            {"pmid": 12345, "analysis_stage": "LOAD_BEARING"},
        ]
        self.assertEqual(derive_analyzed_unique_total(sources), 1)

    def test_analyzed_literature_uses_normalized_title_and_year_last(self) -> None:
        sources = [
            {"title": "A  Mechanistic Study", "year": 2026, "analysis_stage": "TITLE_ABSTRACT_SCREENED"},
            {"localized_title": {"en": "A mechanistic study"}, "year": 2026, "analysis_stage": "FULL_TEXT_REVIEWED"},
        ]
        self.assertEqual(derive_analyzed_unique_total(sources), 1)

    def test_discovered_only_does_not_count_but_title_abstract_screened_does(self) -> None:
        sources = [
            {"doi": "10.1000/discovered", "analysis_stage": "DISCOVERED_ONLY"},
            {"doi": "10.1000/screened", "analysis_stage": "TITLE_ABSTRACT_SCREENED"},
        ]
        self.assertEqual(derive_analyzed_unique_total(sources), 1)

    def test_triaged_and_cited_stages_count_as_substantive_analysis(self) -> None:
        sources = [
            {"doi": "10.1000/triaged", "analysis_stage": "FULL_TEXT_TRIAGED"},
            {"doi": "10.1000/cited", "analysis_stage": "CITED"},
        ]
        self.assertEqual(derive_analyzed_unique_total(sources), 2)

    def test_missing_analysis_stages_do_not_fall_back_to_other_counts(self) -> None:
        sources = [{"doi": "10.1000/cited", "cited_in_reports": [{"report_id": "one"}], "load_bearing": True}]
        self.assertIsNone(derive_analyzed_unique_total(sources))

    def test_run_source_ledger_counts_documented_events_and_deduplicates(self) -> None:
        sources = [
            {
                "doi": "10.1000/example",
                "normalized_title": "first",
                "year": 2026,
                "analysis_events": [
                    {"event_type": "SOURCE_ATLAS_CURATED", "stage_id": "atlas"}
                ],
            },
            {
                "doi": "https://doi.org/10.1000/EXAMPLE",
                "normalized_title": "duplicate",
                "year": 2026,
                "analysis_events": [
                    {"event_type": "REPORT_ARGUMENT_USED", "stage_id": "report"}
                ],
            },
            {
                "doi": "10.1000/no-event",
                "normalized_title": "unqualified",
                "year": 2026,
                "analysis_events": [],
            },
        ]
        self.assertEqual(derive_analyzed_unique_total_from_ledger(sources), 1)

    def test_publish_derives_analyzed_total_from_staged_source_registry(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = make_empty_portal(root)
            source = make_source(root)
            run_path = source / "run.json"
            run = json.loads(run_path.read_text(encoding="utf-8"))
            run["literature_stats"]["analyzed_unique_total"] = None
            run["literature_stats"]["load_bearing_sources"] = 1
            run["literature_stats"]["report_reference_count"] = 0
            run_path.write_text(json.dumps(run), encoding="utf-8")
            source_path = source / "literature" / "index.json"
            source_index = json.loads(source_path.read_text(encoding="utf-8"))
            source_index["sources"][0]["analysis_stage"] = "TITLE_ABSTRACT_SCREENED"
            source_path.write_text(json.dumps(source_index), encoding="utf-8")
            publish_run(source, portal, "PUBLIC_SANITIZED")
            published = json.loads(
                (portal / "content" / "runs" / DEMO_SLUG / "run.json").read_text(encoding="utf-8")
            )
            self.assertEqual(published["literature_stats"]["analyzed_unique_total"], 1)

    def test_current_content_validates(self) -> None:
        result = validate_content(PORTAL)
        self.assertEqual(result["status"], "PASS", result["errors"])
        self.assertEqual(result["run_count"], 3)
        run = json.loads(
            (PORTAL / "content" / "runs" / DEMO_SLUG / "run.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual(run["run_mode"], "FOCUSED_DECISION_RUN")
        self.assertEqual(run["idea_count"], 4)
        self.assertEqual(run["report_count"], 4)
        self.assertNotRegex(
            " ".join(
                [run["title"]["en"], run["subtitle"]["en"], run["summary"]["en"]]
            ),
            r"(?i)arena[- ]selected|top-?1|tournament",
        )

    def test_twenty_ideas_and_two_pdfs_remain_independent_counts(self) -> None:
        ideas = [
            {
                "idea_id": f"idea-{index}",
                "slug": f"idea-{index}",
                "lifecycle_status": "REVIEWED",
                "family_id": f"family-{index}",
                "featured": index == 0,
                "has_fatal_flaw": False,
            }
            for index in range(20)
        ]
        run = {
            "run_mode": "FOCUSED_DECISION_RUN",
            "status": "DONE",
            "terminal_state": "DONE",
            "idea_count": 20,
            "reviewed_idea_count": 20,
            "retained_idea_count": 20,
            "report_count": 2,
            "report_refs": [{"id": "a"}, {"id": "b"}],
            "pairwise_comparisons": [],
            "portfolio_funnel": {
                "raw_generation_count": 20,
                "independent_generation_count": 20,
                "natural_family_count": 20,
                "developed_count": 20,
                "reviewed_count": 20,
                "arena_entrant_count": 0,
                "finalist_count": 0,
                "parked_count": 0,
                "dropped_count": 0,
            },
        }
        errors: list[str] = []
        _validate_portfolio("twenty-two", run, ideas, errors)
        self.assertEqual(errors, [])

    def test_merged_ideas_count_as_provenance_not_independent_attempts(self) -> None:
        ideas = [
            {"lifecycle_status": "REVIEWED", "family_id": "family-a"},
            {"lifecycle_status": "MERGED_INTO_FAMILY", "family_id": "family-a"},
            {"lifecycle_status": "GENERATED", "family_id": "family-b"},
        ]
        counts = _portfolio_counts(ideas)
        self.assertEqual(counts["raw_generation_count"], 3)
        self.assertEqual(counts["independent_generation_count"], 2)
        self.assertEqual(counts["natural_family_count"], 2)

    def test_low_breadth_discovery_can_stop_without_filler(self) -> None:
        ideas = [
            {
                "idea_id": f"idea-{index}", "slug": f"idea-{index}",
                "lifecycle_status": "GENERATED", "family_id": f"family-{index}",
                "featured": False, "has_fatal_flaw": False,
            }
            for index in range(7)
        ]
        run = {
            "run_mode": "DISCOVERY_PORTFOLIO_RUN", "status": "BLOCKED",
            "terminal_state": "INSUFFICIENT_PORTFOLIO_BREADTH", "idea_count": 7,
            "reviewed_idea_count": 0, "retained_idea_count": 0, "report_count": 0,
            "report_refs": [], "pairwise_comparisons": [], "portfolio_funnel": _portfolio_counts(ideas),
        }
        errors: list[str] = []
        _validate_portfolio("low-breadth", run, ideas, errors)
        self.assertEqual(errors, [])
        self.assertEqual(run["portfolio_funnel"]["finalist_count"], 0)

    def test_completed_discovery_requires_generation_accounting(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = root / "portal"
            shutil.copytree(PORTAL / "schemas", portal / "schemas")
            shutil.copytree(PORTAL / "deploy", portal / "deploy")
            shutil.copytree(PORTAL / "content", portal / "content")
            shutil.copytree(PORTAL / "public" / "artifacts", portal / "public" / "artifacts")
            run_path = portal / "content" / "runs" / DEMO_SLUG / "run.json"
            run = json.loads(run_path.read_text(encoding="utf-8"))
            run["run_mode"] = "DISCOVERY_PORTFOLIO_RUN"
            run.pop("portfolio_funnel")
            run_path.write_text(json.dumps(run), encoding="utf-8")
            result = validate_content(portal)
            self.assertEqual(result["status"], "FAIL")
            self.assertTrue(any("portfolio_funnel" in item for item in result["errors"]))

    def test_duplicate_doi_is_rejected_at_run_level(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            portal = Path(temporary) / "portal"
            shutil.copytree(PORTAL / "schemas", portal / "schemas")
            shutil.copytree(PORTAL / "deploy", portal / "deploy")
            shutil.copytree(PORTAL / "content", portal / "content")
            shutil.copytree(PORTAL / "public" / "artifacts", portal / "public" / "artifacts")
            source_path = portal / "content" / "runs" / DEMO_SLUG / "literature" / "index.json"
            index = json.loads(source_path.read_text(encoding="utf-8"))
            duplicate = dict(index["sources"][0])
            duplicate["source_id"] = "duplicate-doi-record"
            index["sources"].append(duplicate)
            source_path.write_text(json.dumps(index), encoding="utf-8")
            result = validate_content(portal)
            self.assertEqual(result["status"], "FAIL")
            self.assertTrue(any("duplicate DOI" in item for item in result["errors"]))

    def test_fatal_flaw_cannot_be_rescued_by_finalist_status(self) -> None:
        idea = {
            "idea_id": "fatal", "slug": "fatal", "lifecycle_status": "FINALIST",
            "family_id": "family-fatal", "featured": False, "has_fatal_flaw": True,
        }
        run = {
            "run_mode": "DISCOVERY_PORTFOLIO_RUN", "status": "RUNNING", "terminal_state": "RUNNING",
            "idea_count": 1, "reviewed_idea_count": 1, "retained_idea_count": 1,
            "report_count": 0, "report_refs": [], "pairwise_comparisons": [],
            "portfolio_funnel": _portfolio_counts([idea]),
        }
        errors: list[str] = []
        _validate_portfolio("fatal", run, [idea], errors)
        self.assertTrue(any("fatal flaw" in item for item in errors))

    def test_publish_is_deterministic_and_source_unchanged(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = make_empty_portal(root)
            source = make_source(root)
            before = tree_hash(source)
            first = publish_run(source, portal, "PUBLIC_SANITIZED")
            first_hash = tree_hash(portal / "content" / "runs" / DEMO_SLUG)
            second = publish_run(source, portal, "PUBLIC_SANITIZED")
            self.assertEqual(first, second)
            self.assertEqual(first_hash, tree_hash(portal / "content" / "runs" / DEMO_SLUG))
            self.assertEqual(before, tree_hash(source))
            self.assertEqual(validate_content(portal)["status"], "PASS")

    def test_missing_idea_pdf_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = make_empty_portal(root)
            source = make_source(root)
            publish_run(source, portal, "PUBLIC_SANITIZED")
            missing = portal / "public" / "artifacts" / DEMO_SLUG / "idea-report-en.pdf"
            missing.unlink()
            result = validate_content(portal)
            self.assertEqual(result["status"], "FAIL")
            self.assertTrue(any("missing PDF" in item for item in result["errors"]))

    def test_path_traversal_is_rejected_and_source_unchanged(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = make_empty_portal(root)
            source = make_source(root)
            allowlist_path = source / "publication-allowlist.json"
            allowlist = json.loads(allowlist_path.read_text(encoding="utf-8"))
            allowlist["approved_artifacts"].append("../outside.txt")
            allowlist_path.write_text(json.dumps(allowlist), encoding="utf-8")
            before = tree_hash(source)
            with self.assertRaises(PublicationError):
                publish_run(source, portal, "PUBLIC_SANITIZED")
            self.assertEqual(before, tree_hash(source))

    @unittest.skipUnless(hasattr(os, "symlink"), "symlinks unavailable")
    def test_symlinked_source_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = make_empty_portal(root)
            source = make_source(root)
            outside = root / "outside.md"
            outside.write_text("external file", encoding="utf-8")
            target = source / "artifacts" / "demo-publication-note.md"
            target.unlink()
            try:
                target.symlink_to(outside)
            except OSError as exc:
                if getattr(exc, "winerror", None) == 1314:
                    self.skipTest("Windows symlink privilege is unavailable")
                raise
            with self.assertRaises(PublicationError):
                publish_run(source, portal, "PUBLIC_SANITIZED")

    def test_stale_public_artifact_is_removed_on_republish(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = make_empty_portal(root)
            source = make_source(root)
            publish_run(source, portal, "PUBLIC_SANITIZED")
            stale = portal / "public" / "artifacts" / DEMO_SLUG / "stale.pdf"
            stale.write_bytes(b"not a real pdf")
            publish_run(source, portal, "PUBLIC_SANITIZED")
            self.assertFalse(stale.exists())

    def test_orphan_public_artifact_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = make_empty_portal(root)
            source = make_source(root)
            publish_run(source, portal, "PUBLIC_SANITIZED")
            orphan = portal / "public" / "artifacts" / DEMO_SLUG / "orphan.txt"
            orphan.write_text("orphan", encoding="utf-8")
            result = validate_content(portal)
            self.assertTrue(
                any("Unreferenced public artifact" in item for item in result["errors"])
            )

    def test_allowlist_run_id_must_match_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = make_empty_portal(root)
            source = make_source(root)
            allowlist_path = source / "publication-allowlist.json"
            allowlist = json.loads(allowlist_path.read_text(encoding="utf-8"))
            allowlist["run_id"] = "different-run"
            allowlist_path.write_text(json.dumps(allowlist), encoding="utf-8")
            with self.assertRaises(PublicationError):
                publish_run(source, portal, "PUBLIC_SANITIZED")

    def test_private_manifest_cannot_be_public(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            portal = make_empty_portal(root)
            source = make_source(root)
            run_path = source / "run.json"
            run = json.loads(run_path.read_text(encoding="utf-8"))
            run["visibility"] = "PRIVATE"
            run_path.write_text(json.dumps(run), encoding="utf-8")
            with self.assertRaises(PublicationError):
                publish_run(source, portal, "PUBLIC_SANITIZED")


if __name__ == "__main__":
    unittest.main()
