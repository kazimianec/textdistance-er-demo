import { useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tab,
  Tabs,
  Container,
} from "@mui/material";
import { theme } from "./theme/theme";
import { Showcases } from "./pages/Showcases";
import { ConsolidatedComparison } from "./pages/ConsolidatedComparison";

const PAGES = [
  { label: "Showcases", component: <Showcases /> },
  { label: "Consolidated Comparison", component: <ConsolidatedComparison /> },
];

function App() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0a12 0%, #0f0f1a 100%)" }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: "rgba(10,10,18,0.9)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Toolbar>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                background: "linear-gradient(90deg, #7c4dff, #b388ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              textdistance ER Demo
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", mr: 2 }}>
              Entity Resolution with 21 algorithms
            </Typography>
          </Toolbar>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              px: 2,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", minHeight: 48 },
              "& .Mui-selected": { color: "#7c4dff !important" },
              "& .MuiTabs-indicator": { backgroundColor: "#7c4dff" },
            }}
          >
            {PAGES.map((p) => (
              <Tab key={p.label} label={p.label} />
            ))}
          </Tabs>
        </AppBar>

        <main>{PAGES[activeTab].component}</main>
      </Box>
    </ThemeProvider>
  );
}

export default App;
