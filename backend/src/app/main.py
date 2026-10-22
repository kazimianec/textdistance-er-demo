"""
FastAPI backend for textdistance Entity Resolution demo.
Computes distance/similarity metrics from the textdistance library.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any

import textdistance as td


app = FastAPI(title="textdistance Entity Resolution API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CompareRequest(BaseModel):
    """Request body for comparing two strings."""
    text1: str
    text2: str


class AlgorithmInfo(BaseModel):
    """Metadata about a single algorithm."""
    name: str
    description: str
    type: str  # "distance" or "similarity"
    best_for: list[str]


class CompareResponse(BaseModel):
    """Response with all computed metrics."""
    text1: str
    text2: str
    scores: dict[str, float]


@app.get("/")
def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "textdistance Entity Resolution API", "version": "1.0.0"}


ALGORITHMS: list[dict[str, Any]] = [
    {
        "name": "levenshtein",
        "description": "Edit distance counting insertions, deletions, substitutions",
        "type": "distance",
        "best_for": ["typos", "spelling errors", "OCR errors"],
    },
    {
        "name": "jaro_winkler",
        "description": "Jaro-Winkler similarity - gives more credit to matching prefixes",
        "type": "similarity",
        "best_for": ["typos", "name matching", "cross-validation"],
    },
    {
        "name": "sorensen_dice",
        "description": "Sorensen-Dice coefficient - bigram-based similarity",
        "type": "similarity",
        "best_for": ["shared substrings", "word reordering"],
    },
    {
        "name": "cosine",
        "description": "Cosine similarity using character n-grams",
        "type": "similarity",
        "best_for": ["shared word patterns", "abbreviation expansions"],
    },
    {
        "name": "jaro",
        "description": "Jaro similarity - ancestor of Jaro-Winkler",
        "type": "similarity",
        "best_for": ["short string matching", "typos"],
    },
    {
        "name": "ratcliff_obershelp",
        "description": "Ratcliff-Obershelp - pattern matching with sequence alignment",
        "type": "similarity",
        "best_for": ["pattern matching", "word reordering"],
    },
    {
        "name": "overlap",
        "description": "Overlap coefficient - measures shared substring length",
        "type": "similarity",
        "best_for": ["substring matching", "shared word detection"],
    },
    {
        "name": "jaccard",
        "description": "Jaccard index - set-based similarity",
        "type": "similarity",
        "best_for": ["set comparison", "shared elements"],
    },
    {
        "name": "dice",
        "description": "Dice coefficient - bigram-based like Sorensen-Dice",
        "type": "similarity",
        "best_for": ["bigram matching", "word overlap"],
    },
    {
        "name": "damerau_levenshtein",
        "description": "Damerau-Levenshtein - allows transpositions",
        "type": "distance",
        "best_for": ["typos with transpositions", "name matching"],
    },
    {
        "name": "editex",
        "description": "Editex - phonetic-aware edit distance",
        "type": "distance",
        "best_for": ["phonetic matching", "name variants"],
    },
    {
        "name": "strcmp95",
        "description": "Strcmp95 - string comparison for names/addresses",
        "type": "similarity",
        "best_for": ["name matching", "address comparison"],
    },
    {
        "name": "hamming",
        "description": "Hamming distance - position-based (requires equal length)",
        "type": "distance",
        "best_for": ["fixed-length codes", "error detection"],
    },
    {
        "name": "mra",
        "description": "Match Rating Algorithm - designed for name comparison",
        "type": "similarity",
        "best_for": ["name matching", "cultural variations"],
    },
    {
        "name": "monge_elkan",
        "description": "Monge-Elkan - asymmetric similarity for complex entity matching",
        "type": "similarity",
        "best_for": ["entity matching", "word reordering", "abbreviation detection"],
    },
    {
        "name": "needleman_wunsch",
        "description": "Needleman-Wunsch - global sequence alignment with gap penalty",
        "type": "similarity",
        "best_for": ["global alignment", "structural matching"],
    },
    {
        "name": "gotoh",
        "description": "Gotoh - affine gap sequence alignment",
        "type": "similarity",
        "best_for": ["sequence alignment", "thorough matching"],
    },
    {
        "name": "tversky",
        "description": "Tversky index - generalized similarity with configurable parameters",
        "type": "similarity",
        "best_for": ["partial matching", "abbreviation detection", "asymmetric matching"],
    },
    {
        "name": "longest_common_subsequence",
        "description": "Length of longest common subsequence (not substring)",
        "type": "similarity",
        "best_for": ["shared sequence detection", "partial matches"],
    },
    {
        "name": "lcsubstr",
        "description": "Length of longest common substring",
        "type": "similarity",
        "best_for": ["substring matching", "shared prefixes/suffixes"],
    },
    {
        "name": "prefix",
        "description": "Common prefix length (normalized)",
        "type": "similarity",
        "best_for": ["shared prefixes", "abbreviations"],
    },
    {
        "name": "suffix",
        "description": "Common suffix length (normalized)",
        "type": "similarity",
        "best_for": ["shared suffixes", "word endings"],
    },
    {
        "name": "entropy_ncd",
        "description": "Normalized Compression Distance via entropy - overall similarity",
        "type": "similarity",
        "best_for": ["overall similarity", "pattern complexity"],
    },
    {
        "name": "identity",
        "description": "Identity similarity (1 if exact match, 0 otherwise)",
        "type": "similarity",
        "best_for": ["exact matching", "deduplication"],
    },
]


def _normalize_distance(score: float, max_score: float) -> float:
    """Normalize a distance score to 0-1 similarity range."""
    if max_score == 0:
        return 1.0
    return round(max(0, 1 - score / max_score), 4)


def _norm_sim(algorithm: object, t1: str, t2: str) -> float:
    """Normalize a textdistance algorithm to 0-1 similarity using the library's own API.

    textdistance exposes `normalized_similarity` on every algorithm, which knows the
    correct maximum for that metric. Hand-rolled formulas get the scale wrong for
    alignment and phonetic metrics (e.g. Monge-Elkan returns a similarity, not a
    distance, so inverting it produces values near 1.0 for unrelated strings).

    The result is clamped to [0, 1]: Gotoh's theoretical minimum does not account
    for the gap penalties incurred by very different-length strings, so its
    normalized_similarity can go negative.

    Only genuine computation failures are swallowed. In particular, an
    ImportError means an optional dependency is missing (textdistance needs
    numpy for Needleman-Wunsch and Gotoh), and reporting that as a similarity
    of 0.0 silently claims two identical strings are completely different.
    """
    try:
        value = float(algorithm.normalized_similarity(t1, t2))
    except ImportError:
        # Re-raise: a missing optional dependency is an environment problem,
        # not a similarity of zero.
        raise
    except Exception:
        return 0.0
    return round(max(0.0, min(1.0, value)), 4)


def _normalize_length(score: float, max_len: float) -> float:
    """Normalize a length-based score to 0-1 similarity range."""
    if max_len == 0:
        return 0.0
    return round(min(score / max_len, 1.0), 4)


def _normalize_ncd(score: float) -> float:
    """Normalize an NCD score (0 = identical, 1 = completely different) to similarity."""
    return round(max(0, 1 - score), 4)


def compute_similarities(text1: str, text2: str) -> dict[str, float]:
    """
    Compute all similarity/distance scores for two strings.

    Returns a dict mapping algorithm names to normalized similarity scores (0-1).
    """
    t1, t2 = text1.strip(), text2.strip()
    if not t1 or not t2:
        return {alg["name"]: 0.0 for alg in ALGORITHMS}

    results: dict[str, float] = {}
    max_len = max(len(t1), len(t2))

    # Levenshtein distance (normalized - invert to similarity)
    lev_dist = td.levenshtein(t1, t2)
    results["levenshtein"] = _normalize_distance(lev_dist, max_len)

    # Jaro-Winkler (similarity)
    results["jaro_winkler"] = round(td.jaro_winkler(t1, t2), 4)

    # Sorensen-Dice (similarity)
    results["sorensen_dice"] = round(td.sorensen_dice(t1, t2), 4)

    # Cosine (similarity)
    results["cosine"] = round(td.cosine(t1, t2), 4)

    # Jaro (similarity)
    results["jaro"] = round(td.jaro(t1, t2), 4)

    # Ratcliff-Obershelp (similarity)
    results["ratcliff_obershelp"] = _norm_sim(td.ratcliff_obershelp, t1, t2)

    # Overlap coefficient
    results["overlap"] = round(td.overlap(t1, t2), 4)

    # Jaccard (similarity)
    results["jaccard"] = round(td.jaccard(t1, t2), 4)

    # Dice (similarity)
    results["dice"] = round(td.dice(t1, t2), 4)

    # Damerau-Levenshtein (normalized)
    dam_lev = td.damerau_levenshtein(t1, t2)
    results["damerau_levenshtein"] = _normalize_distance(dam_lev, max_len)

    # Editex (normalized - lower is more similar)
    results["editex"] = _norm_sim(td.editex, t1, t2)

    # Strcmp95 (similarity)
    results["strcmp95"] = round(td.strcmp95(t1, t2), 4)

    # Hamming (only meaningful for equal-length strings)
    if len(t1) == len(t2):
        results["hamming"] = _norm_sim(td.hamming, t1, t2)
    else:
        results["hamming"] = 0.0

    # MRA (Match Rating Algorithm - rating normalized against the metric's own maximum)
    results["mra"] = _norm_sim(td.mra, t1, t2)

    # Monge-Elkan (returns a similarity for non-identical inputs - do NOT invert)
    results["monge_elkan"] = _norm_sim(td.monge_elkan, t1, t2)

    # Needleman-Wunsch (global alignment, negative distances - use library normalization)
    results["needleman_wunsch"] = _norm_sim(td.needleman_wunsch, t1, t2)

    # Gotoh (affine-gap alignment - use library normalization)
    results["gotoh"] = _norm_sim(td.gotoh, t1, t2)

    # Tversky (similarity - already 0-1)
    results["tversky"] = round(td.tversky(t1, t2), 4)

    # Longest common subsequence (normalized)
    lcs_len = len(td.lcsseq(t1, t2))
    results["longest_common_subsequence"] = _normalize_length(lcs_len, max_len)

    # Longest common substring (normalized)
    lcstr_len = len(td.lcsstr(t1, t2))
    results["lcsubstr"] = _normalize_length(lcstr_len, max_len)

    # Prefix similarity (normalized)
    prefix_len = len(td.prefix(t1, t2))
    results["prefix"] = _normalize_length(prefix_len, max_len)

    # Suffix similarity (normalized)
    suffix_len = len(td.postfix(t1, t2))
    results["suffix"] = _normalize_length(suffix_len, max_len)

    # Entropy NCD (already 0-1, but invert for similarity)
    entropy_raw = td.entropy_ncd(t1, t2)
    results["entropy_ncd"] = _normalize_ncd(entropy_raw)
    results["entropy_ncd"] = round(max(0, min(1, results["entropy_ncd"])), 4)

    # Identity (exact match)
    results["identity"] = 1.0 if t1 == t2 else 0.0

    return results


@app.post("/api/compare", response_model=CompareResponse)
def compare(request: CompareRequest) -> CompareResponse:
    """Compute all similarity/distance scores for two strings."""
    scores = compute_similarities(request.text1, request.text2)
    return CompareResponse(text1=request.text1, text2=request.text2, scores=scores)


@app.get("/api/algorithms", response_model=list[AlgorithmInfo])
def list_algorithms() -> list[AlgorithmInfo]:
    """Return metadata about all available algorithms."""
    return [AlgorithmInfo(**alg) for alg in ALGORITHMS]
