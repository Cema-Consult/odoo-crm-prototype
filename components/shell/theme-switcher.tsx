"use client";
import { useTheme } from "@/lib/theme/provider";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import clsx from "clsx";

const HEX_FIELDS = [
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "accent", label: "Accent" },
  { key: "text", label: "Text" },
] as const;

export function ThemeSwitcher() {
  const { themeId, setThemeId, presets, customTokens, setCustomTokens } = useTheme();
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Theme"
        className="inline-flex size-8 items-center justify-center rounded-lg text-sm hover:bg-muted hover:text-foreground transition-all"
      >
        <Palette className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px]">
        <div className="text-xs uppercase tracking-wide text-text-muted mb-2">Preset</div>
        <div className="grid grid-cols-2 gap-2">
          {presets.map(p => (
            <button key={p.id} onClick={() => setThemeId(p.id)} className={clsx(
              "rounded-md border p-2 text-left",
              themeId === p.id ? "border-accent" : "border-border"
            )}>
              <div className="flex gap-1 mb-1">
                <span className="h-3 w-3 rounded" style={{ background: p.tokens.bg }} />
                <span className="h-3 w-3 rounded" style={{ background: p.tokens.surface }} />
                <span className="h-3 w-3 rounded" style={{ background: p.tokens.accent }} />
                <span className="h-3 w-3 rounded" style={{ background: p.tokens.accent2 }} />
              </div>
              <div className="text-sm">{p.name}</div>
            </button>
          ))}
          <button onClick={() => setThemeId("custom")} className={clsx(
            "rounded-md border p-2 text-left col-span-2",
            themeId === "custom" ? "border-accent" : "border-border"
          )}>
            <div className="text-sm">Custom</div>
            <div className="text-xs text-text-muted">Paste your brand hex values</div>
          </button>
        </div>
        {themeId === "custom" && (
          <div className="mt-3 space-y-2">
            {HEX_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Label className="w-24 text-xs">{label}</Label>
                <Input
                  value={customTokens[key]}
                  onChange={e => setCustomTokens({ [key]: e.target.value })}
                  className="font-mono text-xs"
                />
                <span className="h-6 w-6 rounded border" style={{ background: customTokens[key] }} />
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
