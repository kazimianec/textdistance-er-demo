"""
Regression tests for the optional-dependency contract.

textdistance implements Needleman-Wunsch and Gotoh only when numpy is
importable. When it is not, `td.needleman_wunsch.normalized_similarity(...)`
raises ImportError.

The original `_norm_sim` helper caught every exception and returned 0.0, so a
missing numpy turned "these two strings are identical" into "0% similar" for
two of the 24 metrics, with no error anywhere. It surfaced only in CI, where
the environment was built from the declared dependencies, and never locally,
where a global pyenv install happened to provide numpy.

Two things are now guaranteed:
- numpy is a declared dependency, so the environment always has it.
- a missing optional dependency raises instead of being reported as a score.
"""

import numpy
import pytest
import textdistance as td

from src.app.main import compute_similarities

# The metrics textdistance implements on top of numpy.
NUMPY_BACKED = ["needleman_wunsch", "gotoh"]


def test_numpy_is_available():
    """numpy is a declared dependency and must be importable."""
    assert numpy is not None


@pytest.mark.parametrize("algorithm", NUMPY_BACKED)
def test_numpy_backed_algorithms_are_usable(algorithm):
    """textdistance must not raise ImportError for the numpy-backed metrics."""
    alg = getattr(td, algorithm)
    value = alg.normalized_similarity("Acme", "Acme")
    assert value == pytest.approx(1.0)


@pytest.mark.parametrize("algorithm", NUMPY_BACKED)
def test_norm_sim_does_not_swallow_import_error(algorithm, monkeypatch):
    """A missing optional dependency must propagate, not become a score of 0."""
    alg = getattr(td, algorithm)

    def boom(*args, **kwargs):
        raise ImportError("Please, install numpy for this measure")

    monkeypatch.setattr(alg, "normalized_similarity", boom)

    from src.app.main import _norm_sim

    with pytest.raises(ImportError):
        _norm_sim(alg, "Acme", "Acme")


def test_identical_strings_score_one_for_every_algorithm():
    """No algorithm may report 0 similarity for two identical strings."""
    scores = compute_similarities("Acme", "Acme")
    zero = {k: v for k, v in scores.items() if v == 0.0}
    assert zero == {}, f"algorithms reporting 0 for identical strings: {zero}"


def test_needleman_wunsch_and_gotoh_match_the_expected_values():
    """The two alignment metrics must produce real scores, not a fallback."""
    scores = compute_similarities("Acme", "Acme")
    assert scores["needleman_wunsch"] == 1.0
    assert scores["gotoh"] == 1.0


def test_unrelated_strings_score_low_for_alignment_metrics():
    """The alignment metrics must still discriminate between different strings."""
    scores = compute_similarities("Acme", "Zebra")
    assert scores["needleman_wunsch"] < 0.7
    assert scores["gotoh"] < 0.7
