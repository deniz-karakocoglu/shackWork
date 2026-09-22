/** shackWork marka renkleri */
const brand = {
  primary: "#047857",
  primaryDark: "#064e3b",
  accent: "#10b981",
  surface: "#f0fdf4",
  border: "#d1fae5",
  danger: "#dc2626",
  muted: "#6b7280",
};

export default {
  light: {
    text: "#18181b",
    textMuted: brand.muted,
    background: "#ffffff",
    surface: brand.surface,
    tint: brand.primary,
    tabIconDefault: "#9ca3af",
    tabIconSelected: brand.primary,
    border: brand.border,
    primary: brand.primary,
    primaryDark: brand.primaryDark,
    accent: brand.accent,
    danger: brand.danger,
  },
  dark: {
    text: "#f4f4f5",
    textMuted: "#a1a1aa",
    background: "#0f172a",
    surface: "#1e293b",
    tint: brand.accent,
    tabIconDefault: "#71717a",
    tabIconSelected: brand.accent,
    border: "#334155",
    primary: brand.accent,
    primaryDark: brand.primary,
    accent: brand.accent,
    danger: brand.danger,
  },
};
