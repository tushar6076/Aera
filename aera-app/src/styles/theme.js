// aera-mobile/src/styles/theme.js
import { Platform } from "react-native";

export const colors = {
  // Surfaces & Canvas (Cool-Toned Ice Slate)
  background: "#f8fafc",        // Soft ice slate canvas
  backgroundSubtle: "#f1f5f9",  // Slate 100
  card: "#ffffff",              // Pure white surface
  cardAlt: "#f8fafc",           // Nested card background
  cardMuted: "rgba(241, 245, 249, 0.7)",

  // Borders & Dividers
  border: "#e2e8f0",            // Slate 200
  borderSubtle: "#cbd5e1",      // Slate 300
  borderLight: "#f1f5f9",       // Subtle line

  // Typography
  text: "#0f172a",              // Slate 900
  textSecondary: "#334155",     // Slate 700
  textMuted: "#64748b",         // Slate 500
  textDim: "#94a3b8",           // Slate 400

  // Primary Accent: Sky / Atmospheric Cyan
  primary: "#0284c7",           // Sky 600
  primaryHover: "#0369a1",      // Sky 700
  primaryLight: "#e0f2fe",      // Sky 100
  primaryGlow: "rgba(2, 132, 199, 0.08)",
  primaryBorder: "rgba(2, 132, 199, 0.22)",

  // Secondary Accent: Deep Indigo / Telemetry
  secondary: "#4f46e5",         // Indigo 600
  secondaryLight: "#eef2ff",    // Indigo 50
  secondaryBorder: "rgba(79, 70, 229, 0.2)",

  // Tertiary / Safe State: Teal / Emerald
  success: "#059669",           // Emerald 600
  successLight: "#ecfdf5",      // Emerald 50
  successBorder: "#a7f3d0",     // Emerald 200

  // Alert & Warning States
  warning: "#d97706",           // Amber 600
  warningLight: "#fffbeb",      // Amber 50
  warningBorder: "#fde68a",     // Amber 200

  danger: "#e11d48",            // Rose 600
  dangerLight: "#fff1f2",       // Rose 50
  dangerBorder: "#fecdd3",      // Rose 200

  // Chart & Visualization Spectrum
  chartSky: "#0284c7",
  chartIndigo: "#4f46e5",
  chartTeal: "#0d9488",
  chartAmber: "#d97706",
  chartRose: "#e11d48",
};

export const typography = {
  fontSans: Platform.select({
    ios: "System",
    android: "Roboto",
    default: "sans-serif",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    black: "800",
  },
  sizes: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 48,
  },
};

export const shadows = {
  soft: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
};