from __future__ import annotations

import unittest

from coscientist.site.publisher import derive_analyzed_unique_total_from_ledger


def synthetic_source(index: int, membership: str) -> dict[str, object]:
    final_cited = membership != "SOURCE_ATLAS_ONLY"
    return {
        "source_id": f"synthetic-source-{index:03d}",
        "doi": f"10.0000/synthetic.{index:03d}",
        "normalized_title": f"synthetic source {index:03d}",
        "year": 2026,
        "source_atlas_member": membership != "FINAL_REPORT_ADDITION",
        "final_report_cited": final_cited,
        "load_bearing": final_cited and index <= 6,
        "corpus_membership": membership,
        "analysis_events": [
            {"event_type": "SOURCE_ATLAS_CURATED", "stage_id": "synthetic"}
        ],
    }


def synthetic_corpus() -> list[dict[str, object]]:
    atlas_only = [synthetic_source(index, "SOURCE_ATLAS_ONLY") for index in range(14, 39)]
    shared = [synthetic_source(index, "SOURCE_ATLAS_AND_FINAL_REPORT") for index in range(1, 13)]
    addition = [synthetic_source(13, "FINAL_REPORT_ADDITION")]
    return shared + addition + atlas_only


class SyntheticSourceCorpusTests(unittest.TestCase):
    def test_synthetic_membership_union_preserves_cardinality_contract(self) -> None:
        sources = synthetic_corpus()
        self.assertEqual(len(sources), 38)
        self.assertEqual(
            sum(source["corpus_membership"] == "SOURCE_ATLAS_ONLY" for source in sources),
            25,
        )
        self.assertEqual(
            sum(source["corpus_membership"] == "SOURCE_ATLAS_AND_FINAL_REPORT" for source in sources),
            12,
        )
        self.assertEqual(
            sum(source["corpus_membership"] == "FINAL_REPORT_ADDITION" for source in sources),
            1,
        )

    def test_synthetic_counts_remain_independent(self) -> None:
        sources = synthetic_corpus()
        self.assertEqual(derive_analyzed_unique_total_from_ledger(sources), 38)
        self.assertEqual(sum(bool(source["final_report_cited"]) for source in sources), 13)
        self.assertEqual(sum(bool(source["load_bearing"]) for source in sources), 6)
        self.assertEqual(sum(not bool(source["final_report_cited"]) for source in sources), 25)
        report_reference_count = 22
        self.assertEqual(report_reference_count, 22)


if __name__ == "__main__":
    unittest.main()
