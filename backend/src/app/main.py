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
        "type": "distance",
        "best_for": ["name matching", "cultural variations"],
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


def _normalize_length(score: float, max_len: float) -> float:
    """Normalize a length-based score to 0-1 similarity range."""
    if max_len == 0:
        return 0.0
    return round(min(score / max_len, 1.0), 4)


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
    results["ratcliff_obershelp"] = round(td.ratcliff_obershelp(t1, t2), 4)

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
    editex_dist = td.editex(t1, t2)
    results["editex"] = _normalize_distance(editex_dist, max_len)

    # Strcmp95 (similarity)
    results["strcmp95"] = round(td.strcmp95(t1, t2), 4)

    # Hamming (only if same length, otherwise 0)
    if len(t1) == len(t2):
        results["hamming"] = _normalize_distance(td.hamming(t1, t2), len(t1))
    else:
        results["hamming"] = 0.0

    # MRA (distance - lower is more similar)
    mra_dist = td.mra(t1, t2)
    results["mra"] = _normalize_distance(mra_dist, max(mra_dist, 1))

    # Longest common subsequence (normalized)
    lcs_len = len(td.lcsseq(t1, t2))
    results["longest_common_subsequence"] = _normalize_length(lcs_len, max_len)

    # Longest common substring (normalized)
    lcstr_len = len(td.lcsstr(t1, t2))
    results["lcsubstr"] = _normalize_length(lcstr_len, max_len)

    # Prefix similarity (normalized)
    prefix_len = len(td.prefix(t1, t2))
    results["prefix"] = _normalize_length(prefix_len, max_len)

    # Identity (exact match)
    results["identity"] = 1.0 if t1 == t2 else 0.0

    return results


@app.post("/compare", response_model=CompareResponse)
def compare(request: CompareRequest) -> CompareResponse:
    """Compute all similarity/distance scores for two strings."""
    scores = compute_similarities(request.text1, request.text2)
    return CompareResponse(text1=request.text1, text2=request.text2, scores=scores)


@app.get("/algorithms", response_model=list[AlgorithmInfo])
def list_algorithms() -> list[AlgorithmInfo]:
    """Return metadata about all available algorithms."""
    return [AlgorithmInfo(**alg) for alg in ALGORITHMS]
