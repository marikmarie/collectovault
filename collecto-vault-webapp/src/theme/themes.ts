export type ThemeColors = {
  primary: string;
  primaryText: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  danger: string;
};

export type Theme = {
  name: string;
  colors: ThemeColors;
  logoUrl?: string;
  headerGradient?: string;
};

export const defaultTheme: Theme = {
  name: "default",
  logoUrl: "logo.png",
  headerGradient:
    "linear-gradient(to right top, #18010e, #2b0a1f, #3f0b31, #530a46, #67095d)",
  colors: {
    primary: "#7c4dff",
    primaryText: "#ffffff",
    secondary: "#ffb86b",
    background: "#0b1020",
    surface: "#0f1724",
    text: "#e6eef8",
    border: "#1f2937",
    danger: "#ef4444",
  },
};

export const lightTheme: Theme = {
  name: "light",
  logoUrl: "/images/logo-light.svg",
  headerGradient: "linear-gradient(90deg,#f8fafc,#eef2ff)",
  colors: {
    primary: "#4f46e5",
    primaryText: "#ffffff",
    secondary: "#f59e0b",
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#0f172a",
    border: "#e6eef8",
    danger: "#dc2626",
  },
};

export const themes: Record<string, Theme> = {
  default: defaultTheme,
  light: lightTheme,
};
