import type { ThemeTokens } from "./types";

const KEY_MAP: Record<keyof ThemeTokens, string> = {
  bg: "--bg",
  surface: "--surface",
  surfaceMuted: "--surface-muted",
  border: "--border",
  text: "--text",
  textMuted: "--text-muted",
  accent: "--accent",
  accent2: "--accent-2",
  accent3: "--accent-3",
  success: "--success",
  danger: "--danger",
  warning: "--warning",
};

export function applyTokens(tokens: ThemeTokens, el: HTMLElement = document.documentElement) {
  for (const [key, cssVar] of Object.entries(KEY_MAP) as [keyof ThemeTokens, string][]) {
    el.style.setProperty(cssVar, tokens[key]);
  }
}
