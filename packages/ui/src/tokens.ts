export const DESIGN_TOKENS = {
  colors: {
    dark: {
      canvas: "#090d16",
      surface: "#111827",
      surfaceRaised: "#1e293b",
      surfaceHover: "#283548",
      surfaceGlass: "rgba(17, 24, 39, 0.85)",
      borderSubtle: "#1e293b",
      borderInteractive: "#334155",
      textPrimary: "#f8fafc",
      textSecondary: "#94a3b8",
      textMuted: "#64748b",
      brandIndigo: "#6366f1",
      brandIndigoHover: "#4f46e5",
      brandIndigoSubtle: "rgba(99, 102, 241, 0.15)",
      statusSuccess: "#34d399",
      statusSuccessSurface: "rgba(16, 185, 129, 0.12)",
      statusSuccessBorder: "rgba(16, 185, 129, 0.25)",
      statusWarning: "#fbbf24",
      statusWarningSurface: "rgba(245, 158, 11, 0.12)",
      statusWarningBorder: "rgba(245, 158, 11, 0.25)",
      statusCritical: "#f87171",
      statusCriticalSurface: "rgba(239, 68, 68, 0.12)",
      statusCriticalBorder: "rgba(239, 68, 68, 0.25)",
      statusInfo: "#38bdf8",
      statusInfoSurface: "rgba(56, 189, 248, 0.12)",
      statusInfoBorder: "rgba(56, 189, 248, 0.25)",
    },
    light: {
      canvas: "#f8fafc",
      surface: "#ffffff",
      surfaceRaised: "#f1f5f9",
      surfaceHover: "#e2e8f0",
      surfaceGlass: "rgba(255, 255, 255, 0.85)",
      borderSubtle: "#e2e8f0",
      borderInteractive: "#cbd5e1",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#64748b",
      brandIndigo: "#4f46e5",
      brandIndigoHover: "#4338ca",
      brandIndigoSubtle: "rgba(79, 70, 229, 0.08)",
      statusSuccess: "#059669",
      statusSuccessSurface: "#ecfdf5",
      statusSuccessBorder: "#a7f3d0",
      statusWarning: "#d97706",
      statusWarningSurface: "#fffbeb",
      statusWarningBorder: "#fde68a",
      statusCritical: "#dc2626",
      statusCriticalSurface: "#fef2f2",
      statusCriticalBorder: "#fecaca",
      statusInfo: "#0284c7",
      statusInfoSurface: "#f0f9ff",
      statusInfoBorder: "#bae6fd",
    },
  },
  typography: {
    fontSans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontMono: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
    sizes: {
      display: { size: "2.25rem", lineHeight: "2.75rem", weight: "700", letterSpacing: "-0.025em" },
      headlineLg: { size: "1.75rem", lineHeight: "2.25rem", weight: "600", letterSpacing: "-0.02em" },
      headlineMd: { size: "1.25rem", lineHeight: "1.75rem", weight: "600", letterSpacing: "-0.015em" },
      headlineSm: { size: "0.9375rem", lineHeight: "1.375rem", weight: "600", letterSpacing: "-0.01em" },
      metricNum: { size: "1.5rem", lineHeight: "1.75rem", weight: "700", letterSpacing: "-0.02em" },
      bodyLg: { size: "1.0rem", lineHeight: "1.5rem", weight: "400", letterSpacing: "-0.005em" },
      bodyMd: { size: "0.875rem", lineHeight: "1.25rem", weight: "400", letterSpacing: "0em" },
      bodySm: { size: "0.75rem", lineHeight: "1.0rem", weight: "400", letterSpacing: "0em" },
      labelMd: { size: "0.8125rem", lineHeight: "1.125rem", weight: "500", letterSpacing: "0em" },
      labelSm: { size: "0.6875rem", lineHeight: "0.875rem", weight: "600", letterSpacing: "0.03em" },
    },
  },
  spacing: {
    0.5: "0.125rem", // 2px
    1: "0.25rem",    // 4px
    1.5: "0.375rem", // 6px
    2: "0.5rem",     // 8px
    3: "0.75rem",    // 12px
    4: "1.0rem",     // 16px
    5: "1.25rem",    // 20px
    6: "1.5rem",     // 24px
    8: "2.0rem",     // 32px
    10: "2.5rem",    // 40px
    12: "3.0rem",    // 48px
    16: "4.0rem",    // 64px
  },
  radii: {
    none: "0px",
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  shadows: {
    level0: "none",
    level1: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
    level2: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
    level3: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)",
    level4: "0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)",
    brandGlow: "0 0 20px -5px rgba(99, 102, 241, 0.3)",
    criticalGlow: "0 0 24px 0 rgba(239, 68, 68, 0.45)",
  },
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
};
