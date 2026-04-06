import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7c4dff", light: "#b388ff", dark: "#651fff" },
    secondary: { main: "#00e676", light: "#69f0ae", dark: "#00c853" },
    error: { main: "#ff5252" },
    warning: { main: "#ffd740" },
    success: { main: "#00e676" },
    background: { default: "#0a0a0f", paper: "#12121a" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid rgba(255,255,255,0.08)" },
      },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
  },
});
