# textdistance ER Demo

Entity Resolution with 24 string distance/similarity algorithms from [`textdistance`](https://github.com/orsinium/textdistance).

**Key insight:** Levenshtein distance alone is **not sufficient** for entity resolution. This demo shows why — with 93 test cases across 14 showcases — and which algorithms work better for specific hard cases.

## Live Demo

**Frontend:** `http://localhost:5173`
**Backend API:** `http://localhost:8000`

## Quick Start

```bash
# Backend
cd backend
poetry install
poetry run uvicorn src.app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page: what entity resolution is, why Levenshtein alone fails |
| `/showcases` | 14 showcase tabs, 93 expandable cases with per-algorithm verdicts |
| `/compare` | Consolidated Comparison — paste any two strings, see all 24 algorithms ranked |

## API

```
POST /api/compare        { "text1": "...", "text2": "..." }  ->  { "scores": { <24 algorithms>: 0..1 } }
GET  /api/algorithms                                          ->  algorithm catalogue
```

The API is namespaced under `/api` because the SPA also owns a client-side route
called `/compare`; a bare path proxy would swallow browser navigation.

## The 14 Showcases (93 cases)

Eight **core** showcases, plus six **discovered** ones covering less obvious
entity-resolution traps.

| # | Showcase | Category | Cases | Focus |
|---|----------|----------|-------|-------|
| 1 | Company Names with Abbreviations | core | 8 | Abbreviation expansion (IBM vs International Business Machines), word permutations, legal suffixes |
| 2 | Company Name + Address | core | 6 | Full vs partial addresses, suite/building formatting, directional variants |
| 3 | Person Full Names | core | 8 | Cultural variations (Jon/John), transliterations, middle-initial drop, nicknames |
| 4 | Person Name + Address | core | 5 | Zip+4, Apt vs Suite, omitted street directionals, spelling variants |
| 5 | Long Common Substrings | core | 6 | Shared words in different order — matching words ≠ matching entity |
| 6 | Transliterations & Cross-Alphabet | core | 6 | Москва→Moskva, 北京→Beijing, München→Munich — no shared characters |
| 7 | Heavy Typo Scenarios | core | 8 | Keyboard adjacency errors, double-character mistakes, vowel swaps, missing spaces |
| 8 | Mixed Real-World Noise | core | 6 | OCR errors + abbreviations + transliterations combined |
| 9 | Brand & Product Name Variations | discovered | 6 | Brand vs legal name, parent company vs subsidiary, product line traps |
| 10 | Legal Entity Type Variations | discovered | 6 | Inc vs LLC vs GmbH vs Ltd — same org, different legal form or country |
| 11 | Address Format Differences | discovered | 6 | US vs EU postal conventions, "St" vs "Street", suite notation |
| 12 | Nickname vs Legal Name | discovered | 8 | Bill→William, Bob→Robert, Liz→Elizabeth, Maggie→Margaret |
| 13 | Historical & Outdated Names | discovered | 6 | Constantinople→Istanbul, Burma→Myanmar, AT&T→Bell Labs |
| 14 | Partial & Substring Matches | discovered | 8 | One string a substring of another, where a match may or may not be correct |

Every case is labelled with its ground truth, and per-algorithm verdicts are
shown as ✓ (correctly called match / no-match) or ✗ (missed it / false positive).

## The 24 Algorithms

| Algorithm | Type | Best for |
|-----------|------|----------|
| Levenshtein | distance | Typo detection — but not enough alone |
| Damerau-Levenshtein | distance | Typos involving transpositions |
| Jaro-Winkler | similarity | Name matching with prefix credit |
| Jaro | similarity | Short string matching |
| Sorensen-Dice | similarity | Shared bigrams, word reordering |
| Dice | similarity | Bigram matching |
| Cosine | similarity | N-gram patterns, abbreviation expansion |
| Overlap | similarity | Shared substring ratio |
| Jaccard | similarity | Set-based similarity |
| Ratcliff-Obershelp | similarity | Pattern matching, word reordering |
| Strcmp95 | similarity | Names/addresses, numeric-insensitive |
| Editex | similarity | Phonetic-aware edit distance |
| Hamming | distance | Equal-length strings only |
| MRA | similarity | Name comparison, surname variants |
| Monge-Elkan | similarity | Complex entity matching |
| Needleman-Wunsch | similarity | Global sequence alignment |
| Gotoh | similarity | Affine-gap alignment |
| Tversky | similarity | Partial / abbreviation matching |
| Longest Common Subsequence | similarity | Word or sequence order matters |
| LCSubstring | similarity | Contiguous shared substrings |
| Prefix | similarity | Abbreviation detection |
| Suffix | similarity | Word ending matching |
| Entropy NCD | similarity | Overall similarity, pattern complexity |
| Identity | similarity | Exact match (1.0 or 0.0) |

### Normalization matters

Every metric is normalized through textdistance's own `normalized_similarity`
API rather than a hand-rolled formula. This is not a detail — a hand-rolled
`1 - distance/max_len` is wrong for several metrics:

| Metric | Hand-rolled result | Correct |
|--------|-------------------|---------|
| Monge-Elkan | 0.99 for *unrelated* strings (it returns a similarity, not a distance — inverting it was wrong) | 0.03 |
| Needleman-Wunsch | 0.00 for *identical* strings | 1.00 |
| Gotoh | 0.00 for *identical* strings | 1.00 |
| MRA | 0.375 for *identical* strings | 1.00 |

`backend/tests/test_algorithm_normalization.py` guards all of these.

## Why Levenshtein Alone Fails

```
"International Business Machines"  vs  "IBM"      → should MATCH
  Levenshtein  0.10   ✗ misses it
  Overlap      1.00   ✓
  Jaro-Winkler 0.58   ~

"Amazon Web Services"  vs  "Amazon Internet Services"   → should NOT match
  Levenshtein  0.71   ✗ false positive
  Sorensen-Dice 0.79  ✗ false positive
  Cosine       0.80   ✗ false positive
```

Levenshtein measures edit distance. Abbreviation expansion, word reordering,
transliteration, and length truncation all defeat it. Real entity resolution
combines several metrics and applies thresholds per field.

## Testing

```bash
# Backend — 137 tests
cd backend && python3 -m pytest tests/ -q

# Frontend — 17 Playwright tests, headless
cd frontend && npx playwright test
```

Playwright needs system browser libraries. If Chromium will not start:

```bash
sudo npx playwright install-deps chromium
```

## Project Structure

```
textdistance-er-demo/
├── backend/
│   ├── src/app/main.py                    # FastAPI + 24 algorithms
│   └── tests/
│       ├── test_compute_similarities.py   # 25 tests
│       └── test_algorithm_normalization.py# 112 tests (regression guard)
└── frontend/
    ├── src/
    │   ├── App.tsx                        # react-router routes
    │   ├── api/client.ts                  # API client
    │   ├── components/
    │   │   ├── Layout.tsx                 # app shell + nav
    │   │   ├── CaseCard.tsx               # expandable case card
    │   │   └── AlgorithmBar.tsx           # per-algorithm bars + ✓/✗ verdicts
    │   ├── data/showcases.ts              # 14 showcases, 93 cases
    │   ├── pages/
    │   │   ├── Home.tsx                   # landing page
    │   │   ├── Showcases.tsx              # tabbed showcase browser
    │   │   └── ConsolidatedComparison.tsx # free-form comparison
    │   ├── hooks/useCompare.ts
    │   ├── theme/theme.ts
    │   └── types.ts
    ├── e2e/showcases.spec.ts              # Playwright tests
    └── playwright.config.ts
```

## GitHub

Repository: https://github.com/kazimianec/textdistance-er-demo
