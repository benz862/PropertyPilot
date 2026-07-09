export const colors = {
  primary: "#17394B",
  secondary: "#E3B549",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  information: "#2563EB",
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

export const radius = {
  small: "6px",
  medium: "8px",
  large: "8px",
  xl: "8px",
  full: "9999px",
} as const;

export const typography = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  weights: [400, 500, 600, 700, 800],
  sizes: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
    "5xl": "48px",
    "6xl": "64px",
  },
} as const;

export const shadows = {
  xs: "0 1px 2px rgb(15 23 42 / 0.04)",
  sm: "0 1px 3px rgb(15 23 42 / 0.08)",
  md: "0 4px 12px rgb(15 23 42 / 0.08)",
  lg: "0 10px 24px rgb(15 23 42 / 0.10)",
  xl: "0 18px 40px rgb(15 23 42 / 0.12)",
  "2xl": "0 24px 64px rgb(15 23 42 / 0.16)",
} as const;

export const animation = {
  fast: "120ms",
  normal: "180ms",
  slow: "240ms",
} as const;
