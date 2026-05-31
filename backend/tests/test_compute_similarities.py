"""
Pytest tests for compute_similarities function.
"""

import pytest
from src.app.main import compute_similarities, ALGORITHMS


class TestAlgorithmCount:
    """Test that we have exactly 24 algorithms."""

    def test_algorithm_count(self):
        """Verify we have 24 algorithms as documented."""
        assert len(ALGORITHMS) == 24, f"Expected 24 algorithms, got {len(ALGORITHMS)}"

    def test_all_algorithms_have_required_fields(self):
        """Each algorithm should have name, description, type, best_for."""
        for alg in ALGORITHMS:
            assert "name" in alg
            assert "description" in alg
            assert "type" in alg
            assert "best_for" in alg
            assert alg["type"] in ("distance", "similarity")

    def test_algorithm_names_unique(self):
        """Algorithm names should be unique."""
        names = [alg["name"] for alg in ALGORITHMS]
        assert len(names) == len(set(names)), "Duplicate algorithm names found"


class TestComputeSimilaritiesBasics:
    """Basic tests for compute_similarities function."""

    def test_returns_dict(self):
        """Should return a dictionary."""
        result = compute_similarities("test", "test")
        assert isinstance(result, dict)

    def test_all_algorithms_present(self):
        """Result should contain an entry for every algorithm."""
        result = compute_similarities("test", "test")
        alg_names = {alg["name"] for alg in ALGORITHMS}
        result_names = set(result.keys())
        assert alg_names == result_names, f"Missing: {alg_names - result_names}, Extra: {result_names - alg_names}"

    def test_scores_are_floats(self):
        """All scores should be floats between 0 and 1."""
        result = compute_similarities("test", "test")
        for name, score in result.items():
            # Some algorithms return int, ensure we have comparable numeric types
            assert isinstance(score, (int, float)), f"{name} score should be numeric, got {type(score)}"
            assert 0 <= score <= 1, f"{name} score {score} should be between 0 and 1"

    def test_empty_string_returns_zeros(self):
        """Empty input should return all zeros."""
        result = compute_similarities("", "")
        for name, score in result.items():
            assert score == 0.0, f"{name} should be 0.0 for empty input, got {score}"

    def test_whitespace_only_returns_zeros(self):
        """Whitespace-only input should return all zeros."""
        result = compute_similarities("   ", "   ")
        for name, score in result.items():
            assert score == 0.0, f"{name} should be 0.0 for whitespace input, got {score}"


class TestExactMatch:
    """Tests for exact match cases."""

    def test_identical_strings_high_similarity(self):
        """Identical strings should score 1.0 for identity."""
        result = compute_similarities("IBM", "IBM")
        assert result["identity"] == 1.0

    def test_identical_strings_max_similarity(self):
        """Identical strings should have high scores across most algorithms."""
        result = compute_similarities("test string", "test string")
        # identity should be 1.0
        assert result["identity"] == 1.0
        # jaro_winkler should be 1.0 for identical
        assert result["jaro_winkler"] == 1.0
        # Most similarity algorithms should be high
        assert result["levenshtein"] == 1.0  # normalized: 1 - 0/max_len = 1.0

    def test_completely_different_strings(self):
        """Completely different strings should have low similarity."""
        result = compute_similarities("abc", "xyz")
        # identity should be 0.0
        assert result["identity"] == 0.0
        # levenshtein should be low (but normalized so high = similar, so this is low)
        assert result["levenshtein"] < 0.5


class TestHardPositiveCases:
    """
    Test hard positive cases where strings look different but should match.
    These are the core insight of the demo - Levenshtein fails but other algorithms succeed.
    """

    def test_ibm_abbreviation(self):
        """
        IBM vs International Business Machines is a hard positive.
        Levenshtein should fail (low score) but overlap should succeed (high score).
        """
        result = compute_similarities("International Business Machines", "IBM")

        # Levenshtein fails on abbreviations - should be LOW
        assert result["levenshtein"] < 0.2, "Levenshtein should give low score for abbreviation"

        # But overlap should recognize shared content - should be HIGH
        assert result["overlap"] == 1.0, "Overlap should give high score for shared substrings"

        # Jaro-Winkler should give moderate score
        assert 0.5 < result["jaro_winkler"] < 0.8, "Jaro-Winkler should give moderate score"

    def test_nasa_abbreviation_false_match(self):
        """
        NASA vs North American Soccer Association - both expand to NASA
        but are completely different organizations. This should NOT match.
        """
        result = compute_similarities(
            "National Aeronautics and Space Administration",
            "North American Soccer Association"
        )

        # Both should have low similarity since they share only the acronym letters
        # not the meaning
        assert result["identity"] == 0.0
        # The jaro_winkler may be moderate due to shared letter patterns
        assert result["jaro_winkler"] < 0.8, "Jaro-Winkler should not be too high for different orgs"

    def test_word_permutation(self):
        """Acme Corp USA vs USA Acme Corp should match."""
        result = compute_similarities("Acme Corporation USA", "USA Acme Corporation")

        # Should have high similarity due to same words
        assert result["cosine"] > 0.8, "Cosine should handle word reordering"
        assert result["sorensen_dice"] > 0.8, "Sorensen-Dice should handle word reordering"

    def test_legal_suffix_variation(self):
        """Tech Solutions Inc vs Tech Solutions Incorporated should match."""
        result = compute_similarities("Tech Solutions Inc", "Tech Solutions Incorporated")

        # Should have high similarity
        assert result["levenshtein"] > 0.6, "Levenshtein should handle suffix variation"
        assert result["jaro_winkler"] > 0.8


class TestHardNegativeCases:
    """
    Test hard negative cases where strings look similar but should NOT match.
    """

    def test_john_vs_jon(self):
        """
        John vs Jon - should match (cultural variation) but look different to algorithms.
        """
        result = compute_similarities("John Smith", "Jon Smith")

        # These should match despite being slightly different spellings
        assert result["jaro_winkler"] > 0.8, "Jaro-Winkler should handle Jon/John"

    def test_spelling_variation_boulevard(self):
        """Boulevarde vs Boulevard - same word, different spelling."""
        result = compute_similarities("Boulevarde Avenue", "Boulevard Ave")

        # Levenshtein should penalize the spelling difference
        # but these should still have reasonable similarity
        assert 0.4 < result["levenshtein"] < 0.9


class TestScoreNormalization:
    """Test that scores are properly normalized to 0-1 range."""

    def test_all_scores_in_range(self):
        """All algorithm scores should be between 0 and 1."""
        result = compute_similarities("International Business Machines", "IBM")
        for name, score in result.items():
            assert 0 <= score <= 1, f"{name} score {score} out of range [0, 1]"

    def test_identical_high_scores(self):
        """Identical strings should have scores of 1.0 or close to 1.0."""
        result = compute_similarities("Hello World", "Hello World")
        # Most algorithms should give 1.0 for identical strings
        assert result["identity"] == 1.0
        assert result["jaro_winkler"] == 1.0
        assert result["levenshtein"] == 1.0
        assert result["cosine"] == 1.0
        assert result["overlap"] == 1.0


class TestSpecificAlgorithms:
    """Test specific algorithm behaviors."""

    def test_hamming_different_length(self):
        """Hamming distance should return 0 for different length strings."""
        result = compute_similarities("abc", "abcd")
        assert result["hamming"] == 0.0, "Hamming should be 0 for different lengths"

    def test_hamming_same_length(self):
        """Hamming distance should work for same length strings."""
        result = compute_similarities("abc", "abd")
        assert 0 <= result["hamming"] <= 1.0

    def test_prefix_normalization(self):
        """Prefix should return normalized similarity."""
        result = compute_similarities("International Business Machines", "IBM")
        # prefix = len("IBM") / max(28, 3) = 3/28 ≈ 0.107
        assert 0 < result["prefix"] < 1.0

    def test_suffix_normalization(self):
        """Suffix should return normalized similarity."""
        result = compute_similarities("test", "test")
        assert result["suffix"] == 1.0

    def test_mra_normalized(self):
        """MRA should be normalized to 0-1 similarity."""
        result = compute_similarities("Smith", "Smith")
        # MRA for identical strings should be reasonably high
        assert result["mra"] >= 0.3, "MRA should give non-zero similarity for identical strings"


class TestAlgorithmVariety:
    """Test that different algorithm types produce different scores."""

    def test_algorithms_produce_varied_scores(self):
        """Different algorithms should produce different scores for non-trivial cases."""
        result = compute_similarities("International Business Machines", "IBM")
        scores = list(result.values())

        # Not all scores should be the same
        unique_scores = len(set(scores))
        # At least 40% of algorithms should have different scores
        assert unique_scores >= len(scores) * 0.4, f"Only {unique_scores}/{len(scores)} unique scores - algorithms should produce varied results"
