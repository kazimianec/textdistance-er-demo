# textdistance-er-demo

Entity Resolution demonstration using the `textdistance` Python library.

This project explores various string distance and similarity algorithms for real-world Entity Resolution, with emphasis on **hard positives** (strings that look similar but should NOT match) and **hard negatives** (strings that look different but SHOULD match).

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
textdistance-er-demo/
├── backend/
│   ├── main.py              # FastAPI app with all distance/similarity endpoints
│   ├── requirements.txt     # Python dependencies
│   └── algorithms.md        # Algorithm documentation
├── frontend/
│   ├── src/
│   │   ├── components/      # React components for showcases
│   │   ├── pages/           # Main pages (showcases + consolidated comparison)
│   │   ├── services/        # API client
│   │   └── theme/           # MUI theme
│   └── package.json
├── tests/
│   └── test_showcases.py    # Playwright tests
└── README.md
```

## Key Insight

**Levenshtein distance alone is NOT sufficient for Entity Resolution.**

This demo showcases 15+ algorithms and demonstrates their strengths/weaknesses across various real-world scenarios.
