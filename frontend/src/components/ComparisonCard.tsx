import { Box, Typography, Paper, Divider } from "@mui/material";
import { AlgorithmGrid } from "./ScoreBar";

interface ComparisonCardProps {
  title: string;
  text1: string;
  text2: string;
  scores: Record<string, number>;
  expectedMatch: boolean;
  explanation?: string;
  type?: "hard_positive" | "hard_negative" | "normal";
}

export function ComparisonCard({
  title,
  text1,
  text2,
  scores,
  expectedMatch,
  explanation,
  type,
}: ComparisonCardProps) {
  const isHard =
    type === "hard_positive"
      ? "HARD POSITIVE"
      : type === "hard_negative"
      ? "HARD NEGATIVE"
      : null;

  const badgeColor =
    type === "hard_positive"
      ? { bg: "rgba(255,82,82,0.12)", border: "#ff5252", text: "#ff5252" }
      : type === "hard_negative"
      ? { bg: "rgba(124,77,255,0.12)", border: "#7c4dff", text: "#7c4dff" }
      : null;

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {badgeColor && (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: badgeColor.bg,
            border: `1px solid ${badgeColor.border}`,
            borderRadius: 1,
            px: 1.5,
            py: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: badgeColor.text, fontWeight: 700, letterSpacing: 1 }}
          >
            {isHard}
          </Typography>
        </Box>
      )}

      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>

      {explanation && (
        <Typography variant="body2" sx={{ mb: 2, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
          {explanation}
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 2,
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", mb: 0.5, display: "block" }}>
            String A
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontFamily: "monospace", wordBreak: "break-all", color: "#b388ff" }}
          >
            {text1}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.3)" }}>⟷</Typography>
          <Typography
            variant="caption"
            sx={{
              color: expectedMatch ? "#00e676" : "#ff5252",
              fontWeight: 700,
              display: "block",
              mt: 0.5,
            }}
          >
            {expectedMatch ? "SHOULD MATCH" : "SHOULD NOT MATCH"}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", mb: 0.5, display: "block" }}>
            String B
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontFamily: "monospace", wordBreak: "break-all", color: "#69f0ae" }}
          >
            {text2}
          </Typography>
        </Box>
      </Box>

      <AlgorithmGrid scores={scores} expectedMatch={expectedMatch} />
    </Paper>
  );
}
