"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PRESETS, DEFAULT_THEME_ID, getPreset } from "./presets";
import { applyTokens } from "./apply";
import type { Theme, ThemeTokens, ThemeId } from "./types";

type Ctx = {
  themeId: ThemeId;
  tokens: ThemeTokens;
  customTokens: ThemeTokens;
  setThemeId: (id: ThemeId) => void;
  setCustomTokens: (t: Partial<ThemeTokens>) => void;
  presets: Theme[];
};

const ThemeCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "crm.theme";
const STORAGE_CUSTOM = "crm.theme.custom";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [customTokens, setCustomState] = useState<ThemeTokens>(PRESETS[0].tokens);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const storedCustom = localStorage.getItem(STORAGE_CUSTOM);
    if (storedCustom) {
      try { setCustomState({ ...PRESETS[0].tokens, ...JSON.parse(storedCustom) }); } catch {}
    }
    if (stored) setIdState(stored);
  }, []);

  const tokens: ThemeTokens =
    themeId === "custom" ? customTokens : (getPreset(themeId)?.tokens ?? PRESETS[0].tokens);

  useEffect(() => { applyTokens(tokens); }, [tokens]);

  const setThemeId = useCallback((id: ThemeId) => {
    setIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const setCustomTokens = useCallback((patch: Partial<ThemeTokens>) => {
    setCustomState(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <ThemeCtx.Provider value={{ themeId, tokens, customTokens, setThemeId, setCustomTokens, presets: PRESETS }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme outside ThemeProvider");
  return ctx;
}
