"""
Regression tests for algorithm normalization.

These guard the bugs found during the April 2026 audit, where hand-rolled
normalization formulas produced nonsense scores for five algorithms:

- monge_elkan: textdistance returns a *similarity* for non-identical inputs.
  Inverting it (as a distance) gave 0.99 for totally unrelated strings.
- needleman_wunsch / gotoh: alignment scores are negative and unbounded below,
  so `1 - abs(score)/max_len` gave 0.0 for identical strings and 0.8 for
  unrelated ones - exactly inverted.
- mra: dividing by `min(len)*2` made identical strings score 0.375.
- editex: same distance-inversion mistake as the alignment metrics.

The fix routes every metric through textdistance's own `normalized_similarity`.
"""

import pytest
import textdistance as td

from src.app.main import compute_similarities


ALGORITHM_OBJECTS = {
    "levenshtein": td.levenshtein,
    "damerau_levenshtein": td.damerau_levenshtein,
    "jaro_winkler": td.jaro_winkler,
    "jaro": td.jaro,
    "sorensen_dice": td.sorensen_dice,
    "dice": td.dice,
    "cosine": td.cosine,
    "overlap": td.overlap,
    "jaccard": td.jaccard,
    "ratcliff_obershelp": td.ratcliff_obershelp,
    "strcmp95": td.strcmp95,
    "mra": td.mra,
    "monge_elkan": td.monge_elkan,
    "needleman_wunsch": td.needleman_wunsch,
    "gotoh": td.gotoh,
    "tversky": td.tversky,
    "editex": td.editex,
}

PAIRS = [
    ("Acme Corp", "Acme Corporation"),
    ("Jon Smith", "John Smith"),
    ("Acme", "Zebra"),
    ("Apple Inc", "Toyota Motor Corp"),
    ("International Business Machines", "IBM"),
]


class TestMatchesLibraryGroundTruth:
    """Every algorithm should agree with textdistance's own normalized_similarity."""

    @pytest.mark.parametrize("name", sorted(ALGORITHM_OBJECTS))
    @pytest.mark.parametrize("a,b", PAIRS)
    def test_matches_normalized_similarity(self, name, a, b):
        """Backend score should match the library's normalized_similarity."""
        algorithm = ALGORITHM_OBJECTS[name]
        expected = max(0.0, min(1.0, algorithm.normalized_similarity(a, b)))
        actual = compute_similarities(a, b)[name]
        assert actual == pytest.approx(expected, abs=0.001), (
            f"{name}: backend={actual} but library normalized_similarity={expected}"
        )


class TestIdenticalStrings:
    """Identical strings must score 1.0 on every metric that supports it."""

    @pytest.mark.parametrize(
        "name",
        [
            "levenshtein",
            "jaro_winkler",
            "jaro",
            "sorensen_dice",
            "cosine",
            "overlap",
            "mra",
            "monge_elkan",
            "needleman_wunsch",
            "gotoh",
            "tversky",
            "editex",
            "damerau_levenshtein",
            "identity",
        ],
    )
    def test_identical_scores_one(self, name):
        """A metric that returned <1.0 for identical strings is mis-normalized."""
        result = compute_similarities("Acme Corp", "Acme Corp")
        assert result[name] == 1.0, f"{name} scored {result[name]} for identical strings"


class TestUnrelatedStrings:
    """Totally different strings must not look like matches."""

    @pytest.mark.parametrize(
        "name",
        ["monge_elkan", "needleman_wunsch", "gotoh", "mra", "editex"],
    )
    def test_unrelated_strings_score_low(self, name):
        """The five previously-broken metrics must not report a match for unrelated text."""
        result = compute_similarities("Acme", "Zebra")
        assert result[name] < 0.6, (
            f"{name} scored {result[name]} for 'Acme' vs 'Zebra' - should be clearly dissimilar"
        )

    def test_monge_elkan_not_inverted(self):
        """Regression: monge_elkan used to score 0.99 for unrelated strings."""
        result = compute_similarities("Acme", "Zebra")
        assert result["monge_elkan"] < 0.3


class TestScoreRange:
    """All scores must stay within [0, 1] for any input."""

    @pytest.mark.parametrize("a,b", PAIRS + [("Acme", "Acme"), ("x", "International Business Machines")])
    def test_scores_in_unit_range(self, a, b):
        """Gotoh's normalized_similarity can go negative for very different lengths."""
        for name, score in compute_similarities(a, b).items():
            assert 0.0 <= score <= 1.0, f"{name} score {score} out of range for {a!r}/{b!r}"
