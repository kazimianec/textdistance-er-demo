import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Chip,
  Grid,
  Divider,
} from "@mui/material";
import AlgorithmBar from "../components/AlgorithmBar";
import { useCompare } from "../hooks/useCompare";
import { algorithmDescriptions } from "../data/showcases";

const ALGORITHM_COUNT = Object.keys(algorithmDescriptions).length;

export default function ConsolidatedComparison() {
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
  const ranked = data?.scores
    ? Object.entries(data.scores)
        .filter(([k]) => k !== "identity")
        .sort(([, a], [, b]) => b - a)
    : [];
  const bestAlg = ranked[0];
  // Algorithms that disagree with Levenshtein's verdict
  const disagreements = data
    ? ranked.filter(([, v]) => (v >= 0.7) !== (levenshteinScore >= 0.7))
    : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          Consolidated Comparison
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
          Compare two strings across all {ALGORITHM_COUNT} algorithms simultaneously. See which
          ones succeed or fail, and where they disagree with Levenshtein.
        </Typography>
      </Box>

      {/* Why Levenshtein alone fails */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background:
            "linear-gradient(135deg, rgba(255,82,82,0.08) 0%, rgba(124,77,255,0.08) 100%)",
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
            "Length differences (suffix truncation)",
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
        <Alert
          severity="warning"
          sx={{ background: "rgba(255,215,64,0.08)", border: "1px solid rgba(255,215,64,0.3)" }}
        >
          <Typography variant="body2">
            <strong>Best practice:</strong> use a combination of algorithms. Jaro-Winkler for
            name matching, Sorensen-Dice and Cosine for word structure, MRA for surname
            variants, and Monge-Elkan for complex entity matching. No single metric covers
            every case in entity resolution.
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
          {/* Levenshtein alone verdict */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background:
                levenshteinScore >= 0.7
                  ? "rgba(0,230,118,0.06)"
                  : levenshteinScore <= 0.3
                    ? "rgba(255,82,82,0.06)"
                    : "rgba(255,215,64,0.06)",
              border: `1px solid ${
                levenshteinScore >= 0.7
                  ? "#00e67633"
                  : levenshteinScore <= 0.3
                    ? "#ff525233"
                    : "#ffd74033"
              }`,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Levenshtein-Only Verdict:
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "monospace",
                color:
                  levenshteinScore >= 0.7
                    ? "#00e676"
                    : levenshteinScore <= 0.3
                      ? "#ff5252"
                      : "#ffd740",
                mb: 1,
              }}
            >
              {levenshteinScore.toFixed(4)}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {levenshteinScore >= 0.7
                ? "Levenshtein says: MATCH — but this may be wrong for abbreviations, reordering, or phonetic variants."
                : levenshteinScore <= 0.3
                  ? "Levenshtein says: NO MATCH — but this may be wrong for transliterations or cultural name variations."
                  : "Levenshtein is uncertain — check other algorithms for a clearer picture."}
            </Typography>

            {disagreements.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {disagreements.length} algorithm{disagreements.length === 1 ? "" : "s"} disagree
                  with Levenshtein:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {disagreements.map(([name, score]) => (
                    <Chip
                      key={name}
                      label={`${algorithmDescriptions[name]?.name ?? name} ${score.toFixed(2)}`}
                      size="small"
                      sx={{
                        backgroundColor:
                          score >= 0.7 ? "rgba(0,230,118,0.12)" : "rgba(255,82,82,0.12)",
                        border: `1px solid ${score >= 0.7 ? "#00e67644" : "#ff525244"}`,
                      }}
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>

          {/* Best algorithm */}
          {bestAlg && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: "rgba(255,255,255,0.6)" }}>
                Highest Scoring Algorithm:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Typography variant="h5" sx={{ fontFamily: "monospace", color: "#7c4dff" }}>
                  {algorithmDescriptions[bestAlg[0]]?.name ?? bestAlg[0]}
                </Typography>
                <Chip
                  label={bestAlg[1].toFixed(4)}
                  sx={{ backgroundColor: "rgba(124,77,255,0.15)", border: "1px solid #7c4dff44" }}
                />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                  {algorithmDescriptions[bestAlg[0]]?.description ?? ""}
                </Typography>
              </Box>
            </Box>
          )}

          {/* All scores, ranked */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              All Algorithms — Ranked
            </Typography>
            <AlgorithmBar scores={data.scores} shouldMatch={true} />
          </Paper>

          {/* Algorithm legend */}
          <Paper
            sx={{
              p: 2,
              mt: 3,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Algorithm Quick Reference
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(algorithmDescriptions).map(([alg, info]) => (
                <Grid size={{ xs: 12, sm: 6 }} key={alg}>
                  <Box sx={{ display: "flex", gap: 1, py: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", color: "#7c4dff", minWidth: 140 }}
                    >
                      {info.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                      {info.description}
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
