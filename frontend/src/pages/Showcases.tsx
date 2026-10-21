import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Chip,
  Stack,
} from "@mui/material";
import { showcases } from "../data/showcases";
import CaseCard from "../components/CaseCard";
import type { Showcase } from "../types";

const CATEGORY_LABEL: Record<Showcase["category"], string> = {
  core: "Core",
  additional: "Discovered",
};

export default function Showcases() {
  const [activeTab, setActiveTab] = useState(0);
  const showcase = showcases[activeTab];
  const coreCount = showcases.filter((s) => s.category === "core").length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          Entity Resolution Showcases
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
          {showcases.length} categories,{" "}
          {showcases.reduce((n, s) => n + s.cases.length, 0)} test cases covering hard
          positives (look different, should match) and hard negatives (look similar, should
          not match). Expand any case to see how every algorithm scores it.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Chip
            label={`${coreCount} core showcases`}
            size="small"
            sx={{ backgroundColor: "rgba(124,77,255,0.15)", border: "1px solid #7c4dff44" }}
          />
          <Chip
            label={`${showcases.length - coreCount} discovered showcases`}
            size="small"
            sx={{ backgroundColor: "rgba(0,230,118,0.12)", border: "1px solid #00e67633" }}
          />
        </Stack>
      </Box>

      <Paper
        sx={{
          border: "1px solid rgba(255,255,255,0.08)",
          mb: 3,
          overflow: "auto",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            "& .MuiTab-root": { color: "rgba(255,255,255,0.5)" },
            "& .Mui-selected": { color: "#7c4dff !important" },
            "& .MuiTabs-indicator": { backgroundColor: "#7c4dff" },
          }}
        >
          {showcases.map((s) => (
            <Tab
              key={s.id}
              label={s.name}
              data-testid={`showcase-tab-${s.id}`}
            />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography variant="h6">{showcase.name}</Typography>
              <Chip
                label={CATEGORY_LABEL[showcase.category]}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  backgroundColor:
                    showcase.category === "core"
                      ? "rgba(124,77,255,0.15)"
                      : "rgba(0,230,118,0.12)",
                  color: showcase.category === "core" ? "#b388ff" : "#00e676",
                }}
              />
              <Chip
                label={showcase.difficulty}
                size="small"
                sx={{ height: 20, fontSize: "0.65rem" }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {showcase.description}
            </Typography>
          </Box>

          {showcase.cases.map((testCase) => (
            <CaseCard key={testCase.id} testCase={testCase} />
          ))}
        </Box>
      </Paper>
    </Container>
  );
}
