/**
 * One-off helper: regenerate the curated highlight lists in showcases.ts from
 * live backend scores, so that every KEY algorithm actually crosses the
 * MATCH_THRESHOLD (0.7) used by AlgorithmBar.
 *
 * The curated lists went stale when the backend normalisation was corrected:
 * several listed algorithms that no longer cross the threshold, and two used
 * names that were never API keys ("lcsstr", "compression"), so the KEY chip
 * never rendered for those cases at all.
 *
 * Run: node --experimental-strip-types scripts/regenerate-highlights.mjs
 *   (from frontend/, with the backend running)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { showcases } from '../src/data/showcases.ts'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000'
const MATCH_THRESHOLD = 0.7
const MAX_KEY = 6

const api = (await (await fetch(`${BACKEND}/api/algorithms`)).json()).map(a => a.name)

const scoreCache = new Map()
async function score(t1, t2) {
  const k = `${t1}\u0000${t2}`
  if (!scoreCache.has(k)) {
    const r = await fetch(`${BACKEND}/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text1: t1, text2: t2 }),
    })
    scoreCache.set(k, (await r.json()).scores)
  }
  return scoreCache.get(k)
}

const path = new URL('../src/data/showcases.ts', import.meta.url)
let src = readFileSync(path, 'utf8')
let changed = 0

for (const showcase of showcases) {
  for (const c of showcase.cases) {
    const hasHp = Boolean(c.highlightHardPositive)
    const hasHn = Boolean(c.highlightHardNegative)
    if (!hasHp && !hasHn) continue

    const s = await score(c.text1, c.text2)
    // Algorithms that cross the match threshold. For a hard positive these are
    // the ones that cope; for a hard negative these are the ones that wrongly
    // score the pair as a match. Either way the banner promises "score >= 0.7".
    const copers = api.filter(k => s[k] >= MATCH_THRESHOLD).sort((a, b) => s[b] - s[a])

    let key
    if (hasHp) {
      // The demo's thesis: highlight the algorithms that save you where
      // Levenshtein does not. If Levenshtein copes too then this case does not
      // illustrate that contrast, so fall back to the strongest copers.
      const beatsLev = copers.filter(k => s.levenshtein < MATCH_THRESHOLD)
      key = (beatsLev.length > 0 ? beatsLev : copers).slice(0, MAX_KEY)
    } else {
      key = copers.slice(0, MAX_KEY)
    }
    const literal = `[${key.map(k => `'${k}'`).join(', ')}]`
    const field = hasHp ? 'highlightHardPositive' : 'highlightHardNegative'

    // Anchor on the case id so each replacement targets its own case rather
    // than the first highlight list in the file.
    const idIdx = src.indexOf(`id: '${c.id}',`)
    if (idIdx === -1) throw new Error(`case ${c.id} not found in source`)
    const before = src.slice(idIdx)
    const re = new RegExp(`(${field}:\\s*)\\[[^\\]]*\\]`)
    const m = before.match(re)
    if (!m) throw new Error(`no ${field} for ${c.id}`)
    const oldLiteral = m[0].slice(m[0].indexOf('['))
    if (oldLiteral === literal) continue

    src = src.slice(0, idIdx) + before.replace(re, `$1${literal}`)
    changed++
    console.log(`${c.id} ${field}: ${oldLiteral} -> ${literal}`)
  }
}

writeFileSync(path, src)
console.log(`\nupdated ${changed} highlight lists`)
