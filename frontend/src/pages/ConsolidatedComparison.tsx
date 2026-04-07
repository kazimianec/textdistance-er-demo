import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { AlgorithmGrid } from "../components/ScoreBar";
import { useCompare } from "../hooks/useCompare";

const ALGORITHM_DESCRIPTIONS: Record<string, string> = {
  levenshtein: "Edit distance — counts insertions, deletions, substitutions",
  jaro_winkler: "Prefix-weighted similarity — good for short names",
  sorensen_dice: "Bigram-based — detects shared word structure",
  cosine: "N-gram cosine similarity — robust to reordering",
  metaphone: "Phonetic encoding — matches sounds like 'ck'/'k'",
  nysiis: "NYSIIS phonetic — better than Soundex for surnames",
  soundex: "Classic phonetic code — historical name matching",
  mra: "Match Rating Algorithm — designed for name comparison",
  jaro: "Jaro similarity — ancestor of Jaro-Winkler",
  monge_elkan: "Affine-gap asymmetric similarity — great for entities",
  needleman_wunsch: "Global sequence alignment — structural matching",
  gotoh: "Gotoh alignment — affine gaps, very thorough",
  overlap: "Overlap coefficient — shared substring ratio",
  tversky: "Generalized similarity — partial matching",
  longest_common_subsequence: "LCS length — word/sequence order matters",
  lcsubstr: "Longest common substring — contiguous matches",
  prefix: "Common prefix length — abbreviation detection",
  suffix: "Common suffix length — word ending matching",
  identity: "Exact match — 1.0 or 0.0 only",
  compression: "Normalized compression — overall similarity",
  entropy: "Entropy-based — pattern complexity comparison",
};

export function ConsolidatedComparison() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [submitted1, setSubmitted1] = useState("");
  const [submitted2, setSubmitted2] = useState("");

  const { data, isLoading, error } = useCompare(submitted1, submitted2);

  const handleCompare = () => {
    setSubmitted1(text1);
    setSubmitted2(text2);
  };

  const levenshteinScore = data?.scores?.levenshtein ?? 0;
  const bestScore = data?.scores
    ? Math.max(...Object.entries(data.scores)
        .filter(([k]) => k !== "identity")
        .map(([, v]) => v))
    : 0;
  const bestAlg = data?.scores
    ? Object.entries(data.scores)
        .filter(([k]) => k !== "identity")
        .reduce((a, b) => (b[1] > a[1] ? b : a))[0]
    : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          Consolidated Comparison
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
          Compare two strings across all 21 algorithms simultaneously. See which ones
          succeed or fail on hard cases.
        </Typography>
      </Box>

      {/* Why Levenshtein alone fails */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: "linear-gradient(135deg, rgba(255,82,82,0.08) 0%, rgba(124,77,255,0.08) 100%)",
          border: "1px solid rgba(255,82,82,0.25)",
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, color: "#ff5252" }}>
          ⚠️ Why Levenshtein Distance Alone Is Not Enough
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
          Levenshtein counts character edits — but it struggles with:
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {[
            "Abbreviation expansion (IBM vs International Business Machines)",
            "Word reordering (Acme Corp vs Corp Acme)",
            "Phonetic similarity (García vs Garcia)",
            "Prefix/suffix matching (Corp vs Corporation)",
            "Transliteration (Москва vs Moskva)",
          ].map((item) => (
            <Chip
              key={item}
              label={item}
              size="small"
              sx={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </Box>
        <Alert severity="warning" sx={{ background: "rgba(255,215,64,0.08)", border: "1px solid rgba(255,215,64,0.3)" }}>
          <Typography variant="body2">
            <strong>Best practice:</strong> Use a combination of algorithms. Look at Jaro-Winkler
            for name matching, Sorensen-Dice for word structure, Metaphone/NYSIIS for phonetic
            variants, and Monge-Elkan for complex entity matching.
          </Typography>
        </Alert>
      </Paper>

      {/* Input Section */}
      <Paper sx={{ p: 3, mb: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Enter Two Strings to Compare
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 2, mb: 2 }}>
          <TextField
            label="String A"
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g., International Business Machines"
          />
          <Typography sx={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.3)" }}>
            vs
          </Typography>
          <TextField
            label="String B"
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g., IBM"
          />
        </Box>
        <Button
          variant="contained"
          onClick={handleCompare}
          disabled={!text1.trim() || !text2.trim() || isLoading}
          sx={{ px: 4 }}
        >
          {isLoading ? "Computing..." : "Compare All Algorithms"}
        </Button>
      </Paper>

      {/* Results */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Backend error. Is the FastAPI server running on port 8000?
        </Alert>
      )}

      {data && (
        <>
          {/* Levenshtein alone warning */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background: levenshteinScore > 0.7 ? "rgba(0,230,118,0.06)" : "rgba(255,82,82,0.06)",
              border: `1px solid ${levenshteinScore > 0.7 ? "#00e67633" : "#ff525233"}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Levenshtein-Only Verdict:
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "monospace",
                color: levenshteinScore > 0.7 ? "#00e676" : "#ff5252",
                mb: 1,
              }}
            >
              {levenshteinScore.toFixed(4)}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {levenshteinScore > 0.7
                ? "Levenshtein says: MATCH — but this may be wrong for abbreviations, reordering, or phonetic variants."
                : levenshteinScore < 0.3
                ? "Levenshtein says: NO MATCH — but this may be wrong for transliterations or cultural name variations."
                : "Levenshtein is uncertain — check other algorithms for a clearer picture."}
            </Typography>
          </Paper>

          {/* Best algorithm */}
          {bestAlg && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: "rgba(255,255,255,0.6)" }}>
                Highest Scoring Algorithm:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h5" sx={{ fontFamily: "monospace", color: "#7c4dff" }}>
                  {bestAlg.replace(/_/g, " ")}
                </Typography>
                <Chip
                  label={`${bestScore.toFixed(4)}`}
                  sx={{ backgroundColor: "rgba(124,77,255,0.15)", border: "1px solid #7c4dff44" }}
                />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                  {ALGORITHM_DESCRIPTIONS[bestAlg] || ""}
                </Typography>
              </Box>
            </Box>
          )}

          {/* All scores */}
          <AlgorithmGrid scores={data.scores} expectedMatch={true} />

          {/* Algorithm legend */}
          <Paper sx={{ p: 2, mt: 3, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Algorithm Quick Reference
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(ALGORITHM_DESCRIPTIONS).map(([alg, desc]) => (
                <Grid item xs={12} sm={6} key={alg}>
                  <Box sx={{ display: "flex", gap: 1, py: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", color: "#7c4dff", minWidth: 140 }}
                    >
                      {alg.replace(/_/g, " ")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                      {desc}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
}
