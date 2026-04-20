import { describe, it, expect, beforeEach } from "vitest";
import { applyTokens } from "./apply";
import { PRESETS } from "./presets";

describe("applyTokens", () => {
  beforeEach(() => { document.documentElement.removeAttribute("style"); });

  it("writes every token as a CSS variable on :root", () => {
    const midnight = PRESETS[0].tokens;
    applyTokens(midnight);
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--bg")).toBe(midnight.bg);
    expect(style.getPropertyValue("--surface")).toBe(midnight.surface);
    expect(style.getPropertyValue("--accent")).toBe(midnight.accent);
    expect(style.getPropertyValue("--accent-2")).toBe(midnight.accent2);
  });

  it("overwrites previously-set variables when called again", () => {
    applyTokens(PRESETS[0].tokens);
    applyTokens(PRESETS[1].tokens);
    expect(document.documentElement.style.getPropertyValue("--accent"))
      .toBe(PRESETS[1].tokens.accent);
  });
});
