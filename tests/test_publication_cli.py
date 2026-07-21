from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from coscientist.site import PublicationError, publish_run, validate_content


PORTAL = Path(__file__).resolve().parents[1]


def tree_hash(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        digest.update(path.relative_to(root).as_posix().encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


class PublicationCliTests(unittest.TestCase):
    def test_current_content_validates(self) -> None:
        result = validate_content(PORTAL)
        self.assertEqual(result["status"], "PASS", result["errors"])
        self.assertEqual(result["run_count"], 3)

    def test_missing_pdf_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            copy = Path(temporary) / "portal"
            shutil.copytree(PORTAL / "content", copy / "content")
            shutil.copytree(PORTAL / "schemas", copy / "schemas")
            shutil.copytree(PORTAL / "deploy", copy / "deploy")
            shutil.copytree(PORTAL / "public", copy / "public")
            missing = copy / "public" / "artifacts" / "xrrna-prime-assembly-demo" / "idea-report-en.pdf"
            missing.unlink()
            result = validate_content(copy)
            self.assertEqual(result["status"], "FAIL")
            self.assertTrue(any("missing approved artifact" in item for item in result["errors"]))

    def test_path_traversal_is_rejected_and_source_unchanged(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / "source"
            source.mkdir()
            (source / "run.json").write_text(json.dumps({"slug": "demo", "visibility": "PUBLIC_SANITIZED"}), encoding="utf-8")
            (source / "publication-allowlist.json").write_text(json.dumps({"schema_version": "PublicationAllowlistV1", "run_id": "demo", "visibility": "PUBLIC_SANITIZED", "approved_artifacts": ["run.json", "../outside.txt"], "denied_patterns": [], "approved_by": "test", "approved_at": "2026-01-01T00:00:00Z"}), encoding="utf-8")
            before = tree_hash(source)
            with self.assertRaises(PublicationError):
                publish_run(source, PORTAL, "PUBLIC_SANITIZED")
            self.assertEqual(before, tree_hash(source))

    def test_private_manifest_cannot_be_public(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / "source"
            source.mkdir()
            (source / "run.json").write_text(json.dumps({"slug": "private", "visibility": "PRIVATE"}), encoding="utf-8")
            (source / "publication-allowlist.json").write_text(json.dumps({"schema_version": "PublicationAllowlistV1", "run_id": "private", "visibility": "PUBLIC_SANITIZED", "approved_artifacts": ["run.json"], "denied_patterns": [], "approved_by": "test", "approved_at": "2026-01-01T00:00:00Z"}), encoding="utf-8")
            with self.assertRaises(PublicationError):
                publish_run(source, PORTAL, "PUBLIC_SANITIZED")


if __name__ == "__main__":
    unittest.main()
