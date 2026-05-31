# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (FastAPI)
```bash
cd backend
poetry install
poetry run uvicorn src.app.main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev          # Dev server at http://localhost:5173
npm run build        # TypeScript compile + Vite build
npm run lint         # ESLint
```

### E2E Tests (Playwright)
```bash
cd frontend
npx playwright test                         # Run all tests
npx playwright test e2e/showcases.spec.ts   # Run single test file
npx playwright install-deps chromium        # Install browser deps (first time)
```

E2E tests require both backend (port 8000) and frontend (port 5173) running.

## Architecture

This is a full-stack demo with a single-file FastAPI backend and a React frontend.

**Backend** (`backend/src/app/main.py`):
- Single file — all logic lives here
- Two endpoints: `POST /compare` and `GET /algorithms`
- `compute_similarities()` runs all 18 algorithms and normalizes results to `[0, 1]` similarity scores
- Distance algorithms (levenshtein, damerau_levenshtein, editex, hamming, mra) are inverted via `_normalize_distance()`; length-based scores (lcs, lcsubstr, prefix) are normalized via `_normalize_length()`
- The `ALGORITHMS` list is the source of truth for metadata; the `compute_similarities()` function must stay in sync with it manually

**Frontend** (`frontend/src/`):
- `App.tsx` — top-level routing; two routes: `/` (Showcases) and `/consolidated`
- `src/data/showcases.ts` — hardcoded showcase data (14 showcases, each with test cases typed as `TestCase`)
- `src/types.ts` — shared TypeScript interfaces (`TestCase`, `Showcase`, `AlgorithmScore`, `CompareResult`)
- `src/api/client.ts` — axios client; uses Vite proxy so `/compare` and `/algorithms` route to `localhost:8000`
- `src/hooks/useCompare.ts` — React Query wrapper with 30s stale time
- Pages: `Showcases.tsx` (tabbed interface over 14 showcases) and `ConsolidatedComparison.tsx` (free-form string input comparing all algorithms)
- Theme: dark MUI theme in `src/theme/theme.ts`

**Vite proxy** (`frontend/vite.config.ts`): `/compare` and `/algorithms` proxied to `http://localhost:8000` — frontend makes requests to its own origin, no CORS issues in dev. Backend still has `allow_origins=["*"]` for non-proxied access.

**Showcase data model**: Each `Showcase` has a list of `TestCase` objects with `shouldMatch: boolean` (true = same entity, false = different). Cases are also tagged as hard positives (look different but should match) or hard negatives (look similar but should not match) via `highlightHardPositive`/`highlightHardNegative` fields.

## Adding Algorithms

To add a new algorithm:
1. Add an entry to `ALGORITHMS` in `backend/src/app/main.py`
2. Add computation logic inside `compute_similarities()`, ensuring the result key matches the `name` field
3. The frontend automatically renders all scores returned by the API — no frontend changes needed
