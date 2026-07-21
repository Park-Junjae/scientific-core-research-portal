from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path

from coscientist.site import PublicationError, publish_run, validate_content


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
    def test_current_content_validates(self) -> None:
        result = validate_content(PORTAL)
        self.assertEqual(result["status"], "PASS", result["errors"])
        self.assertEqual(result["run_count"], 3)

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
            missing = portal / "public" / "artifacts" / DEMO_SLUG / "measurement-report-en.pdf"
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
            target.symlink_to(outside)
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
