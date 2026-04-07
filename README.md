# textdistance ER Demo

Entity Resolution with 21 string distance/similarity algorithms from [`textdistance`](https://github.com/orsinium/textdistance).

**Key insight:** Levenshtein distance alone is **not sufficient** for entity resolution. This demo shows why — and which algorithms work better for specific hard cases.

## Live Demo

**Frontend:** `http://localhost:5173`  
**Backend API:** `http://localhost:8000`

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn src.app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## What's Built

### 14 Showcase Tabs

| # | Showcase | Description |
|---|----------|-------------|
| 1 | **Company Names** | Abbreviation expansion (IBM vs International Business Machines), permutations, legal suffixes |
| 2 | **Company + Address** | Address formatting, suite abbreviations, directional variants |
| 3 | **Person Names** | Nickname→legal (Bill→William), cultural variations (Jon→John), middle initial drop |
| 4 | **Name + Address** | Zip+4, apt/suite synonyms, directional omission, spelling variations |
| 5 | **Long Common Substrings** | IBM International vs IBM Corporation — shared words don't mean same entity |
| 6 | **Transliterations** | Москва→Moskva, 北京→Beijing, München→Munich — cross-alphabet matching |
| 7 | **Heavy Typos** | Keyboard adjacency errors, double-character mistakes, missing spaces |
| 8 | **Mixed Noise** | OCR + abbreviation + typos combined |
| 9 | **Brand Variations** | Brand vs legal name, parent vs subsidiary, product line traps |
| 10 | **Legal Entity Types** | Inc vs LLC (same entity, different structure), GmbH vs Ltd (different countries) |
| 11 | **OCR / Scraping** | 0 vs O, 1 vs l vs I, invisible unicode spaces, line breaks |
| 12 | **URL / Domain** | www prefix, subdomain variation, typosquatting detection |
| 13 | **Scientific Names** | Generic vs brand drug names, gene symbol vs full name |
| 14 | **Historical Names** | Constantinople→Istanbul, Burma→Myanmar, AT&T→Bell Labs |

### 21 Algorithms

| Algorithm | Type | Best For |
|-----------|------|----------|
| Levenshtein | distance | Typo detection (but not enough alone) |
| Jaro-Winkler | similarity | Name matching with prefix credit |
| Sorensen-Dice | similarity | Shared bigrams, word reordering |
| Cosine | similarity | N-gram patterns, abbreviation expansion |
| Metaphone | phonetic | Phonetic variants (ck/k sounds) |
| NYSIIS | phonetic | Surname phonetic matching |
| Soundex | phonetic | Historical name matching |
| MRA | phonetic | Name comparison, cultural variants |
| Jaro | similarity | Short string matching |
| Monge-Elkan | similarity | Complex entity matching |
| Needleman-Wunsch | similarity | Global sequence alignment |
| Gotoh | similarity | Affine gap sequence alignment |
| Overlap | similarity | Shared substring ratio |
| Tversky | similarity | Partial matching, abbreviation detection |
| Longest Common Subsequence | similarity | Word order matters |
| LCSubstring | similarity | Contiguous shared substrings |
| Prefix | similarity | Abbreviation detection |
| Suffix | similarity | Word ending matching |
| Identity | similarity | Exact match (1.0 or 0.0) |
| Compression | similarity | Overall similarity via NCD |
| Entropy | similarity | Pattern complexity comparison |

### Hard Positives vs Hard Negatives

- **Hard Positive:** Strings look very similar but should **NOT** match (e.g., "Amazon Web Services" vs "Amazon Internet Services")
- **Hard Negative:** Strings look very different but **SHOULD** match (e.g., "Москва" vs "Moskva")

Each showcase example is labeled with its type.

## Hard Positive Example: IBM

```
String A: International Business Machines
String B: IBM
Expected:  MATCH (same entity)

Levenshtein: 0.0968  ← VERY LOW (fails!)
Jaro-Winkler: 0.5771 ← Moderate
MRA:          1.0000 ← Correct!
Overlap:      1.0000 ← Correct!
```

Levenshtein says "no match" because it sees 28 characters vs 3 characters. But MRA (Match Rating Algorithm) correctly identifies them as the same entity.

## Playwright Tests

```bash
cd frontend
npx playwright test
```

**Note:** Requires system browser dependencies (`npx playwright install-deps chromium`). Tests verify:
- All 14 showcase tabs render and navigate correctly
- API integration returns all 21 algorithm scores
- Consolidated comparison page works end-to-end
- Hard positive/negative cases are properly flagged

## Project Structure

```
textdistance-er-demo/
├── backend/
│   ├── src/app/main.py     # FastAPI + 21 algorithm computations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Main app with tab navigation
│   │   ├── api/client.ts              # API client
│   │   ├── components/
│   │   │   ├── ScoreBar.tsx           # Visual score bars with highlighting
│   │   │   └── ComparisonCard.tsx     # Side-by-side comparison card
│   │   ├── hooks/useCompare.ts        # React Query hook for API
│   │   ├── pages/
│   │   │   ├── Showcases.tsx          # 14-tab showcase page
│   │   │   └── ConsolidatedComparison.tsx  # Full algorithm comparison
│   │   └── theme/theme.ts             # Dark MUI theme
│   ├── e2e/showcases.spec.ts          # Playwright tests
│   └── playwright.config.ts
└── README.md
```

## GitHub

Repository: https://github.com/kazimianec/textdistance-er-demo
