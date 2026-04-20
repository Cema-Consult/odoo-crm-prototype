export type ThemeTokens = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accent2: string;
  accent3: string;
  success: string;
  danger: string;
  warning: string;
};

export type ThemeId = "midnight" | "ember" | "forest" | "odoo-dark" | "custom";
export type Theme = { id: ThemeId; name: string; tokens: ThemeTokens };
