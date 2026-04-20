import type { Theme, ThemeId } from "./types";

export const PRESETS: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    tokens: {
      bg: "#0F172A", surface: "#1E293B", surfaceMuted: "#334155",
      border: "#334155", text: "#F1F5F9", textMuted: "#94A3B8",
      accent: "#38BDF8", accent2: "#A78BFA", accent3: "#4ADE80",
      success: "#4ADE80", danger: "#F87171", warning: "#FBBF24",
    },
  },
  {
    id: "ember",
    name: "Ember",
    tokens: {
      bg: "#1C1917", surface: "#292524", surfaceMuted: "#44403C",
      border: "#44403C", text: "#FAFAF9", textMuted: "#A8A29E",
      accent: "#F97316", accent2: "#EC4899", accent3: "#FBBF24",
      success: "#4ADE80", danger: "#F87171", warning: "#FBBF24",
    },
  },
  {
    id: "forest",
    name: "Forest",
    tokens: {
      bg: "#0C1612", surface: "#14261F", surfaceMuted: "#1F3A2E",
      border: "#1F3A2E", text: "#ECFDF5", textMuted: "#86EFAC",
      accent: "#10B981", accent2: "#22D3EE", accent3: "#FCD34D",
      success: "#10B981", danger: "#F87171", warning: "#FCD34D",
    },
  },
  {
    id: "odoo-dark",
    name: "Odoo Dark",
    tokens: {
      bg: "#17121D", surface: "#2A1F33", surfaceMuted: "#3F2F4A",
      border: "#3F2F4A", text: "#F5F0F7", textMuted: "#C4B5C9",
      accent: "#B585A6", accent2: "#E91E63", accent3: "#00A09D",
      success: "#00A09D", danger: "#F87171", warning: "#FBBF24",
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = "midnight";
export function getPreset(id: string) {
  return PRESETS.find(p => p.id === id);
}
