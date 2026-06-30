import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

export const tokens = (mode) => ({
  grey: {
    100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1",
    400: "#94a3b8", 500: "#64748b", 600: "#475569",
    700: "#334155", 800: "#1e293b", 900: "#0f172a",
  },
  primary: {
    100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc",
    400: "#818cf8", 500: "#6366f1", 600: "#4f46e5",
    700: "#4338ca", 800: "#3730a3", 900: "#312e81",
  },
  blueAccent: {
    100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd",
    400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb",
    700: "#1d4ed8", 800: "#1e3a8a", 900: "#172554",
  },
  violetAccent: {
    100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
    400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed",
    700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95",
  },
  greenAccent: {
    100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
    400: "#34d399", 500: "#10b981", 600: "#059669",
    700: "#047857", 800: "#065f46", 900: "#064e3b",
  },
  redAccent: {
    100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5",
    400: "#f87171", 500: "#ef4444", 600: "#dc2626",
    700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d",
  },
  bg: {
    primary:   "#0a0f1e",
    secondary: "#0f172a",
    card:      "#1e293b",
    cardHover: "#263347",
    overlay:   "rgba(15,23,42,0.8)",
  },
});

export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: "dark",
      primary:    { main: colors.blueAccent[500] },
      secondary:  { main: colors.violetAccent[500] },
      success:    { main: colors.greenAccent[500] },
      error:      { main: colors.redAccent[500] },
      warning:    { main: "#f59e0b" },
      info:       { main: colors.blueAccent[400] },
      background: { default: colors.bg.primary, paper: colors.bg.card },
      text:       { primary: colors.grey[100], secondary: colors.grey[400] },
      divider:    "rgba(148,163,184,0.1)",
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', sans-serif",
      h1: { fontWeight: 700 }, h2: { fontWeight: 700 },
      h3: { fontWeight: 600 }, h4: { fontWeight: 600 },
      h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { background: "#0a0f1e", color: "#f1f5f9" },
          "& ::-webkit-scrollbar": { width: 6, height: 6 },
          "& ::-webkit-scrollbar-track": { background: "transparent" },
          "& ::-webkit-scrollbar-thumb": { background: "rgba(148,163,184,0.25)", borderRadius: 3 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none", background: "#1e293b", border: "1px solid rgba(148,163,184,0.1)" },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, textTransform: "none", fontWeight: 600, letterSpacing: 0 },
          contained: {
            background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            "&:hover": { background: "linear-gradient(135deg,#2563eb,#7c3aed)", boxShadow: "0 4px 20px rgba(59,130,246,0.35)" },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 600, fontSize: 11 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { background: "#1e293b", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 16 },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              "& fieldset": { borderColor: "rgba(148,163,184,0.2)" },
              "&:hover fieldset": { borderColor: "rgba(59,130,246,0.5)" },
              "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(148,163,184,0.2)" },
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: "none",
            background: "#1e293b",
            borderRadius: 12,
            "& .MuiDataGrid-cell": { borderBottom: "1px solid rgba(148,163,184,0.08)", color: "#f1f5f9" },
            "& .MuiDataGrid-columnHeaders": { background: "rgba(59,130,246,0.12)", borderBottom: "1px solid rgba(59,130,246,0.2)" },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" },
            "& .MuiDataGrid-row:hover": { background: "rgba(59,130,246,0.06)" },
            "& .MuiDataGrid-footerContainer": { background: "rgba(59,130,246,0.08)", borderTop: "1px solid rgba(148,163,184,0.08)" },
            "& .MuiDataGrid-virtualScroller": { background: "#1e293b" },
            "& .MuiTablePagination-root": { color: "#94a3b8" },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { "& .MuiTabs-indicator": { background: "linear-gradient(90deg,#3b82f6,#8b5cf6)", height: 3, borderRadius: 2 } },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600, color: "#64748b", "&.Mui-selected": { color: "#3b82f6" } },
        },
      },
    },
  };
};

export const ColorModeContext = createContext({});

export const useMode = () => {
  const [mode] = useState("dark");
  const colorMode = useMemo(() => ({}), []);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
