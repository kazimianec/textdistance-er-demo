import { Box, Typography, Paper, LinearProgress, Chip, Divider } from "@mui/material";

interface ScoreBarProps {
  name: string;
  score: number;
  maxScore?: number;
  highlight?: "good" | "bad" | "neutral";
}

export function ScoreBar({ name, score, highlight = "neutral" }: ScoreBarProps) {
  const color =
    highlight === "good"
      ? "#00e676"
      : highlight === "bad"
      ? "#ff5252"
      : "#7c4dff";

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          {name}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {highlight !== "neutral" && (
            <Chip
              label={highlight === "good" ? "✓ Match" : "✗ Mismatch"}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.65rem",
                backgroundColor: highlight === "good" ? "rgba(0,230,118,0.15)" : "rgba(255,82,82,0.15)",
                color: highlight === "good" ? "#00e676" : "#ff5252",
                border: `1px solid ${highlight === "good" ? "#00e676" : "#ff5252"}33`,
              }}
            />
          )}
          <Typography variant="body2" sx={{ fontFamily: "monospace", color }}>
            {score.toFixed(4)}
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score * 100}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.08)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: color,
            borderRadius: 4,
          },
        }}
      />
    </Box>
  );
}

interface AlgorithmGridProps {
  scores: Record<string, number>;
  expectedMatch: boolean;
  levenshteinOnly?: boolean;
}

export function AlgorithmGrid({ scores, expectedMatch, levenshteinOnly }: AlgorithmGridProps) {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);

  return (
    <Paper sx={{ p: 2, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>
        {levenshteinOnly ? "Levenshtein Score" : "All Algorithm Scores"}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1 }}>
        {sorted.map(([alg, score]) => {
          const isGood = expectedMatch ? score > 0.7 : score < 0.3;
          const isBad = expectedMatch ? score < 0.4 : score > 0.6;
          const highlight = isGood ? "good" : isBad ? "bad" : "neutral";
          return (
            <ScoreBar
              key={alg}
              name={alg.replace(/_/g, " ")}
              score={score}
              highlight={highlight}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
