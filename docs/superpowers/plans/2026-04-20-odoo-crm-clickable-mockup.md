# Odoo CRM Clickable Mockup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pitch-ready, reusable clickable mockup of an Odoo CRM "skin" — a custom-branded Next.js frontend driven by a mock API layer shaped like Odoo's CRM models, so the real Odoo adapter can be dropped in later without touching the frontend.

**Architecture:** Next.js 15 (app router) + TypeScript + Tailwind (CSS-variable driven themes) + shadcn/ui. All reads/writes go through a `DataSource` interface with two implementations — `MockDataSource` (in-memory, seeded from JSON) and `OdooDataSource` (typed stub). Route handlers at `/api/*` provide a clean REST contract. Four dark theme presets plus a live "Custom" hex slot in the theme switcher.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, @dnd-kit, Zod, lucide-react, Playwright, Vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-04-20-odoo-crm-clickable-mockup-design.md`

---

## Phase 0: Repo bootstrap

### Task 0: Initialize git repo

**Files:**
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Init git and make first commit**

Run in project root:

```bash
git init
git config user.email "kfl@a18n.dk"
git config user.name "Kennet Frahm Larsen"
```

- [ ] **Step 2: Write `.gitignore`**

```gitignore
node_modules/
.next/
out/
dist/
.env
.env.local
.DS_Store
.vercel
playwright-report/
test-results/
.superpowers/
```

- [ ] **Step 3: Write `README.md`** (minimum — we fill in properly in Task 25)

```markdown
# Odoo CRM — Clickable Mockup

Pitch prototype. See `docs/superpowers/specs/2026-04-20-odoo-crm-clickable-mockup-design.md` for the design.
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore README.md docs/
git commit -m "chore: initialize repo and commit design spec"
```

---

## Phase 1: Scaffold & foundation

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Create Next.js app (non-interactive)**

Run:

```bash
pnpm dlx create-next-app@latest . \
  --typescript --tailwind --app --eslint --src-dir=false \
  --import-alias "@/*" --use-pnpm --no-turbopack --yes
```

Expected: Next.js 15 scaffolded into the current directory.

- [ ] **Step 2: Add runtime + dev dependencies**

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  zod lucide-react clsx tailwind-merge class-variance-authority \
  cmdk sonner date-fns recharts

pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react \
  @testing-library/jest-dom @testing-library/user-event \
  @playwright/test
```

- [ ] **Step 3: Add `.env.example`**

```
DATA_SOURCE=mock
SESSION_SECRET=dev-only-not-a-real-secret
```

- [ ] **Step 4: Smoke-test the scaffold**

```bash
pnpm dev
```

Expected: server on http://localhost:3000, default Next.js page renders. Kill with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 app with deps"
```

### Task 2: Tailwind theme-variable config

**Files:**
- Modify: `tailwind.config.ts`
- Replace: `app/globals.css`

- [ ] **Step 1: Replace `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        "accent-3": "var(--accent-3)",
        success: "var(--success)",
        danger: "var(--danger)",
        warning: "var(--warning)",
      },
      fontFamily: { sans: ["var(--font-inter)"] },
      borderRadius: { lg: "10px", md: "8px", sm: "6px" },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0F172A;
  --surface: #1E293B;
  --surface-muted: #334155;
  --border: #334155;
  --text: #F1F5F9;
  --text-muted: #94A3B8;
  --accent: #38BDF8;
  --accent-2: #A78BFA;
  --accent-3: #4ADE80;
  --success: #4ADE80;
  --danger: #F87171;
  --warning: #FBBF24;
}

html, body { height: 100%; }
body { background: var(--bg); color: var(--text); }
* { border-color: var(--border); }
```

- [ ] **Step 3: Wire the font in `app/layout.tsx`**

Replace contents with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = { title: "CRM", description: "Odoo CRM prototype" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verify**

Replace `app/page.tsx` with:

```tsx
export default function Home() {
  return <div className="p-8 text-text">Tailwind + theme vars wired.</div>;
}
```

Run `pnpm dev`, confirm dark slate page renders.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(theme): CSS-variable driven Tailwind theme"
```

### Task 3: shadcn/ui primitives

**Files:**
- Create: `components/ui/button.tsx`, `input.tsx`, `dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `select.tsx`, `label.tsx`, `checkbox.tsx`, `badge.tsx`, `avatar.tsx`, `separator.tsx`, `popover.tsx`, `progress.tsx`, `tabs.tsx`, `toast.tsx`
- Create: `lib/utils.ts`

- [ ] **Step 1: Install shadcn CLI and init**

```bash
pnpm dlx shadcn@latest init --yes --base-color slate --css-variables
```

When it asks where to put components, accept `components/ui`. Make sure import alias is `@/components`.

- [ ] **Step 2: Pull the primitives we need**

```bash
pnpm dlx shadcn@latest add button input dialog sheet dropdown-menu tooltip select label checkbox badge avatar separator popover progress tabs sonner --yes
```

- [ ] **Step 3: Harmonize shadcn variables with our theme vars**

Open `app/globals.css`. shadcn's init added `--primary`, `--background`, etc. Add these aliases inside `:root` so shadcn primitives honor our tokens:

```css
  --background: var(--bg);
  --foreground: var(--text);
  --card: var(--surface);
  --card-foreground: var(--text);
  --popover: var(--surface);
  --popover-foreground: var(--text);
  --primary: var(--accent);
  --primary-foreground: var(--bg);
  --secondary: var(--surface-muted);
  --secondary-foreground: var(--text);
  --muted: var(--surface-muted);
  --muted-foreground: var(--text-muted);
  --destructive: var(--danger);
  --destructive-foreground: var(--bg);
  --ring: var(--accent);
  --radius: 10px;
```

- [ ] **Step 4: Verify a Button renders**

In `app/page.tsx`:

```tsx
import { Button } from "@/components/ui/button";
export default function Home() {
  return <div className="p-8"><Button>Hello</Button></div>;
}
```

Run `pnpm dev`, confirm button styles are applied.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): add shadcn primitives wired to theme variables"
```

### Task 4: Theme system (presets + provider)

**Files:**
- Create: `lib/theme/presets.ts`, `lib/theme/apply.ts`, `lib/theme/provider.tsx`, `lib/theme/types.ts`
- Create: `lib/theme/presets.test.ts`

- [ ] **Step 1: Write `lib/theme/types.ts`**

```ts
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
```

- [ ] **Step 2: Write `lib/theme/presets.ts`**

```ts
import type { Theme } from "./types";

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

export const DEFAULT_THEME_ID: import("./types").ThemeId = "midnight";
export function getPreset(id: string) {
  return PRESETS.find(p => p.id === id);
}
```

- [ ] **Step 3: Write the test first for `apply.ts`**

Create `lib/theme/presets.test.ts`:

```ts
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
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Add script to `package.json` under `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Run test to verify it fails**

```bash
pnpm test
```

Expected: failure — `applyTokens` not defined.

- [ ] **Step 6: Implement `lib/theme/apply.ts`**

```ts
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
```

- [ ] **Step 7: Run test, expect PASS**

```bash
pnpm test
```

- [ ] **Step 8: Write `lib/theme/provider.tsx`**

```tsx
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
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(theme): presets, applyTokens, ThemeProvider with custom slot"
```

### Task 5: AppShell (sidebar + topbar + theme switcher)

**Files:**
- Create: `components/shell/app-shell.tsx`, `components/shell/sidebar.tsx`, `components/shell/topbar.tsx`, `components/shell/theme-switcher.tsx`, `components/shell/user-menu.tsx`

- [ ] **Step 1: `components/shell/sidebar.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Kanban, ListChecks, Users, Phone, Sparkles } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", Icon: Kanban },
  { href: "/opportunities", label: "Opportunities", Icon: ListChecks },
  { href: "/contacts", label: "Contacts", Icon: Users },
  { href: "/activities", label: "Activities", Icon: Phone },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-[240px] shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
        <Sparkles className="h-5 w-5 text-accent" />
        <span className="font-semibold">CRM Studio</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={clsx(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
              active ? "bg-surface-muted text-text" : "text-text-muted hover:text-text hover:bg-surface-muted/50"
            )}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: `components/shell/theme-switcher.tsx`**

```tsx
"use client";
import { useTheme } from "@/lib/theme/provider";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme"><Palette className="h-4 w-4" /></Button>
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
```

- [ ] **Step 3: `components/shell/topbar.tsx`**

```tsx
"use client";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { UserMenu } from "./user-menu";

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <header className="h-14 border-b border-border bg-surface flex items-center px-4 gap-3">
      <button
        onClick={onOpenPalette}
        className="flex items-center gap-2 text-sm text-text-muted bg-surface-muted hover:bg-surface-muted/70 rounded-md px-3 py-1.5 w-[360px]"
      >
        <Search className="h-4 w-4" />
        Search…
        <kbd className="ml-auto text-[10px] border border-border rounded px-1 py-0.5">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
        <ThemeSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: `components/shell/user-menu.tsx`**

```tsx
"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-surface-muted">
        <Avatar className="h-7 w-7"><AvatarFallback>DM</AvatarFallback></Avatar>
        <span className="text-sm">Demo User</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>Profile</DropdownMenuItem>
        <DropdownMenuItem disabled>Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 5: `components/shell/app-shell.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "@/components/command-palette/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
```

- [ ] **Step 6: Stub CommandPalette so the shell compiles** (real one in Task 22)

Create `components/command-palette/command-palette.tsx`:

```tsx
"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4">
        <div className="text-sm text-text-muted">Search palette (to be implemented).</div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(shell): AppShell with sidebar, topbar, theme switcher"
```

### Task 6: Root layouts & query provider

**Files:**
- Create: `app/providers.tsx`, `app/(app)/layout.tsx`
- Modify: `app/layout.tsx`, delete `app/page.tsx` and create `app/(app)/dashboard/page.tsx` placeholder

- [ ] **Step 1: `app/providers.tsx`**

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { useState } from "react";
import { ThemeProvider } from "@/lib/theme/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        {children}
        <Toaster theme="dark" richColors />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Update `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = { title: "CRM", description: "Odoo CRM prototype" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}
```

- [ ] **Step 3: `app/(app)/layout.tsx`**

```tsx
import { AppShell } from "@/components/shell/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 4: Replace `app/page.tsx` with redirect**

```tsx
import { redirect } from "next/navigation";
export default function RootRedirect() { redirect("/dashboard"); }
```

- [ ] **Step 5: Placeholder dashboard**

Create `app/(app)/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return <div className="p-6">Dashboard placeholder — filled in Task 20.</div>;
}
```

- [ ] **Step 6: Verify end-to-end**

```bash
pnpm dev
```

Expected: visiting `/` redirects to `/dashboard`, shell renders with sidebar + topbar + theme switcher. Click theme switcher, verify switching palettes changes the UI.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(app): providers and (app) layout group"
```

---

## Phase 2: Data layer

### Task 7: Domain types & Zod schemas

**Files:**
- Create: `lib/schemas/core.ts`, `lib/schemas/index.ts`
- Test: `lib/schemas/core.test.ts`

- [ ] **Step 1: Write the schemas**

`lib/schemas/core.ts`:

```ts
import { z } from "zod";

export const Currency = z.enum(["EUR", "USD", "DKK"]);
export const Priority = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

export const Stage = z.object({
  id: z.string(),
  name: z.string(),
  sequence: z.number().int(),
  fold: z.boolean(),
});

export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string(),
});

export const Contact = z.object({
  id: z.string(),
  name: z.string(),
  isCompany: z.boolean(),
  parentId: z.string().nullable(),
  email: z.string(),
  phone: z.string(),
  title: z.string().nullable(),
  city: z.string(),
  country: z.string(),
  tags: z.array(z.string()),
});

export const Opportunity = z.object({
  id: z.string(),
  name: z.string(),
  partnerId: z.string(),
  salespersonId: z.string(),
  stageId: z.string(),
  expectedRevenue: z.number().nonnegative(),
  probability: z.number().min(0).max(100),
  currency: Currency,
  tags: z.array(z.string()),
  priority: Priority,
  createdAt: z.string(),
  expectedClose: z.string().nullable(),
  description: z.string(),
});

export const ActivityType = z.enum(["call", "meeting", "email", "todo"]);
export const Activity = z.object({
  id: z.string(),
  opportunityId: z.string(),
  type: ActivityType,
  summary: z.string(),
  scheduledAt: z.string(),
  done: z.boolean(),
  assignedTo: z.string(),
});

export type Stage = z.infer<typeof Stage>;
export type User = z.infer<typeof User>;
export type Contact = z.infer<typeof Contact>;
export type Opportunity = z.infer<typeof Opportunity>;
export type Activity = z.infer<typeof Activity>;

export const OpportunityCreate = Opportunity.omit({ id: true, createdAt: true });
export const OpportunityPatch = Opportunity.partial().omit({ id: true, createdAt: true });
export const ContactCreate = Contact.omit({ id: true });
export const ContactPatch = Contact.partial().omit({ id: true });
export const ActivityCreate = Activity.omit({ id: true });
export const ActivityPatch = Activity.partial().omit({ id: true });

export const ListOpportunitiesQuery = z.object({
  stage: z.string().optional(),
  q: z.string().optional(),
  tag: z.string().optional(),
  salespersonId: z.string().optional(),
});
export const StageChange = z.object({ stageId: z.string() });
```

`lib/schemas/index.ts`:

```ts
export * from "./core";
```

- [ ] **Step 2: Write roundtrip test**

`lib/schemas/core.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { Opportunity, Contact, Activity, OpportunityCreate } from "./core";

const opp = {
  id: "o1", name: "Acme — Website", partnerId: "p1", salespersonId: "u1",
  stageId: "s1", expectedRevenue: 12000, probability: 40, currency: "EUR",
  tags: ["enterprise"], priority: 2, createdAt: "2026-04-01T00:00:00Z",
  expectedClose: "2026-05-01", description: "Pitch notes",
};

describe("schemas", () => {
  it("parses a valid Opportunity", () => { expect(Opportunity.parse(opp)).toEqual(opp); });
  it("rejects invalid probability", () => {
    expect(() => Opportunity.parse({ ...opp, probability: 150 })).toThrow();
  });
  it("OpportunityCreate omits id + createdAt", () => {
    const { id, createdAt, ...rest } = opp;
    expect(() => OpportunityCreate.parse(rest)).not.toThrow();
  });
});
```

- [ ] **Step 3: Run, expect PASS**

```bash
pnpm test
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(schemas): Zod schemas for CRM domain types"
```

### Task 8: DataSource interface and factory

**Files:**
- Create: `lib/data-source/types.ts`, `lib/data-source/index.ts`

- [ ] **Step 1: `lib/data-source/types.ts`**

```ts
import type {
  Opportunity, Contact, Stage, Activity, User,
} from "@/lib/schemas/core";

export type ListOpportunitiesParams = {
  stage?: string; q?: string; tag?: string; salespersonId?: string;
};
export type ListContactsParams = { q?: string; isCompany?: boolean };
export type ListActivitiesParams = { opportunityId?: string; assignedTo?: string; done?: boolean };

export type DashboardSummary = {
  pipelineValue: number;
  wonThisMonth: number;
  activitiesToday: number;
  newLeadsThisWeek: number;
  funnel: { stageId: string; name: string; count: number }[];
  forecast: { month: string; value: number }[];
  upcomingActivities: Activity[];
  recentlyWon: Opportunity[];
};

export interface DataSource {
  opportunities: {
    list(p: ListOpportunitiesParams): Promise<Opportunity[]>;
    get(id: string): Promise<Opportunity | null>;
    create(data: Omit<Opportunity, "id" | "createdAt">): Promise<Opportunity>;
    update(id: string, patch: Partial<Omit<Opportunity, "id" | "createdAt">>): Promise<Opportunity | null>;
    remove(id: string): Promise<boolean>;
    changeStage(id: string, stageId: string): Promise<Opportunity | null>;
  };
  contacts: {
    list(p: ListContactsParams): Promise<Contact[]>;
    get(id: string): Promise<Contact | null>;
    create(data: Omit<Contact, "id">): Promise<Contact>;
    update(id: string, patch: Partial<Omit<Contact, "id">>): Promise<Contact | null>;
  };
  stages: { list(): Promise<Stage[]> };
  users: { list(): Promise<User[]>; get(id: string): Promise<User | null> };
  activities: {
    list(p: ListActivitiesParams): Promise<Activity[]>;
    create(data: Omit<Activity, "id">): Promise<Activity>;
    update(id: string, patch: Partial<Omit<Activity, "id">>): Promise<Activity | null>;
  };
  dashboard: { summary(): Promise<DashboardSummary> };
}
```

- [ ] **Step 2: `lib/data-source/index.ts` (factory)**

```ts
import type { DataSource } from "./types";
import { makeMockDataSource } from "./mock";

let _cached: DataSource | null = null;

export function getDataSource(): DataSource {
  if (_cached) return _cached;
  const which = process.env.DATA_SOURCE ?? "mock";
  if (which === "odoo") {
    throw new Error("Odoo data source not implemented yet. Set DATA_SOURCE=mock.");
  }
  _cached = makeMockDataSource();
  return _cached;
}

export type { DataSource } from "./types";
```

- [ ] **Step 3: Commit** (after `makeMockDataSource` exists in Task 9, this will compile)

*No commit yet — do it after Task 9.*

### Task 9: Seed data

**Files:**
- Create: `data/seed/stages.json`, `users.json`, `contacts.json`, `opportunities.json`, `activities.json`

- [ ] **Step 1: `data/seed/stages.json`**

```json
[
  { "id": "s_new", "name": "New", "sequence": 1, "fold": false },
  { "id": "s_qualified", "name": "Qualified", "sequence": 2, "fold": false },
  { "id": "s_proposition", "name": "Proposition", "sequence": 3, "fold": false },
  { "id": "s_won", "name": "Won", "sequence": 4, "fold": false },
  { "id": "s_lost", "name": "Lost", "sequence": 5, "fold": true }
]
```

- [ ] **Step 2: `data/seed/users.json`** (5 salespeople)

```json
[
  { "id": "u_anna", "name": "Anna Lindqvist", "email": "anna@studio.co", "avatar": "AL" },
  { "id": "u_mikael", "name": "Mikael Eriksson", "email": "mikael@studio.co", "avatar": "ME" },
  { "id": "u_sara", "name": "Sara Nielsen", "email": "sara@studio.co", "avatar": "SN" },
  { "id": "u_jonas", "name": "Jonas Berg", "email": "jonas@studio.co", "avatar": "JB" },
  { "id": "u_lena", "name": "Lena Kowalski", "email": "lena@studio.co", "avatar": "LK" }
]
```

- [ ] **Step 3: `data/seed/contacts.json`** (20 companies + 40 people linked via `parentId`)

Write full dataset with realistic company names. Example structure — continue with 60 entries total:

```json
[
  { "id": "c_nordic_retail", "name": "Nordic Retail Group", "isCompany": true, "parentId": null, "email": "hello@nordicretail.com", "phone": "+45 70 20 10 01", "title": null, "city": "Copenhagen", "country": "Denmark", "tags": ["retail", "enterprise"] },
  { "id": "c_magnus_skov", "name": "Magnus Skov", "isCompany": false, "parentId": "c_nordic_retail", "email": "m.skov@nordicretail.com", "phone": "+45 30 12 45 67", "title": "Head of Operations", "city": "Copenhagen", "country": "Denmark", "tags": ["decision-maker"] }
]
```

The executing agent should generate: 20 companies across Nordic/European industries (retail, SaaS, manufacturing, hospitality, logistics, agency, healthcare, fintech, education, media — 2 each), each with 2 linked individuals (1 decision-maker, 1 day-to-day contact). No Lorem ipsum. Varied Nordic/European names and cities.

- [ ] **Step 4: `data/seed/opportunities.json`** (30 deals)

Spread across stages: 8 New, 8 Qualified, 7 Proposition, 5 Won, 2 Lost. Each deal:
- `name` pattern: `"<Company> — <Project>"` e.g. `"Nordic Retail — Website redesign"`.
- `partnerId` = a company id from contacts.
- `salespersonId` rotated across the 5 users.
- `expectedRevenue` spread €5,000 to €180,000.
- `probability` set per stage (New=10, Qualified=30, Proposition=60, Won=100, Lost=0) with small variance.
- `currency` mixed EUR/USD/DKK.
- `priority` 0–3 varied.
- `tags` 1–3 each from: `enterprise`, `smb`, `strategic`, `fast-close`, `renewal`, `expansion`.
- `createdAt` within past 90 days.
- `expectedClose` within next 90 days (null for Lost).
- `description` one sentence of actual context.

- [ ] **Step 5: `data/seed/activities.json`** (80 activities)

Distribute across opportunities (2–4 per open deal). Mix of types. Distribution:
- 20 overdue (scheduledAt before today, `done=false`)
- 15 scheduled today
- 30 upcoming this week
- 15 done in past 14 days

- [ ] **Step 6: Verify JSON validity**

```bash
node -e "['stages','users','contacts','opportunities','activities'].forEach(f => JSON.parse(require('fs').readFileSync('data/seed/' + f + '.json','utf8')));"
```

Expected: no output (success).

- [ ] **Step 7: Commit**

```bash
git add data/
git commit -m "feat(seed): demo-ready CRM seed data"
```

### Task 10: MockDataSource

**Files:**
- Create: `lib/data-source/mock.ts`
- Test: `lib/data-source/mock.test.ts`

- [ ] **Step 1: Test first**

`lib/data-source/mock.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { makeMockDataSource } from "./mock";

describe("MockDataSource", () => {
  it("lists opportunities and filters by stage", async () => {
    const ds = makeMockDataSource();
    const all = await ds.opportunities.list({});
    expect(all.length).toBeGreaterThan(0);
    const qualified = await ds.opportunities.list({ stage: "s_qualified" });
    expect(qualified.every(o => o.stageId === "s_qualified")).toBe(true);
  });

  it("changeStage updates the opportunity", async () => {
    const ds = makeMockDataSource();
    const all = await ds.opportunities.list({});
    const updated = await ds.opportunities.changeStage(all[0].id, "s_won");
    expect(updated?.stageId).toBe("s_won");
    const fetched = await ds.opportunities.get(all[0].id);
    expect(fetched?.stageId).toBe("s_won");
  });

  it("create assigns id + createdAt", async () => {
    const ds = makeMockDataSource();
    const users = await ds.users.list();
    const created = await ds.opportunities.create({
      name: "Test", partnerId: "c_nordic_retail", salespersonId: users[0].id,
      stageId: "s_new", expectedRevenue: 1000, probability: 10, currency: "EUR",
      tags: [], priority: 1, expectedClose: null, description: "",
    });
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
  });

  it("dashboard summary returns expected shape", async () => {
    const ds = makeMockDataSource();
    const s = await ds.dashboard.summary();
    expect(s.funnel.length).toBeGreaterThan(0);
    expect(typeof s.pipelineValue).toBe("number");
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
pnpm test
```

- [ ] **Step 3: Implement `lib/data-source/mock.ts`**

```ts
import type { DataSource, DashboardSummary, ListOpportunitiesParams, ListContactsParams, ListActivitiesParams } from "./types";
import type { Opportunity, Contact, Stage, Activity, User } from "@/lib/schemas/core";
import stagesSeed from "@/data/seed/stages.json";
import usersSeed from "@/data/seed/users.json";
import contactsSeed from "@/data/seed/contacts.json";
import opportunitiesSeed from "@/data/seed/opportunities.json";
import activitiesSeed from "@/data/seed/activities.json";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function makeMockDataSource(): DataSource {
  const stages: Stage[] = [...(stagesSeed as Stage[])];
  const users: User[] = [...(usersSeed as User[])];
  const contacts: Contact[] = [...(contactsSeed as Contact[])];
  const opportunities: Opportunity[] = [...(opportunitiesSeed as Opportunity[])];
  const activities: Activity[] = [...(activitiesSeed as Activity[])];

  const now = () => new Date().toISOString();

  return {
    opportunities: {
      async list(p: ListOpportunitiesParams) {
        return opportunities.filter(o => {
          if (p.stage && o.stageId !== p.stage) return false;
          if (p.salespersonId && o.salespersonId !== p.salespersonId) return false;
          if (p.tag && !o.tags.includes(p.tag)) return false;
          if (p.q && !o.name.toLowerCase().includes(p.q.toLowerCase())) return false;
          return true;
        });
      },
      async get(id) { return opportunities.find(o => o.id === id) ?? null; },
      async create(data) {
        const o: Opportunity = { ...data, id: uid("o"), createdAt: now() };
        opportunities.push(o);
        return o;
      },
      async update(id, patch) {
        const i = opportunities.findIndex(o => o.id === id);
        if (i === -1) return null;
        opportunities[i] = { ...opportunities[i], ...patch };
        return opportunities[i];
      },
      async remove(id) {
        const i = opportunities.findIndex(o => o.id === id);
        if (i === -1) return false;
        opportunities.splice(i, 1);
        return true;
      },
      async changeStage(id, stageId) {
        return this.update(id, { stageId });
      },
    },
    contacts: {
      async list(p: ListContactsParams) {
        return contacts.filter(c => {
          if (p.isCompany !== undefined && c.isCompany !== p.isCompany) return false;
          if (p.q && !c.name.toLowerCase().includes(p.q.toLowerCase())) return false;
          return true;
        });
      },
      async get(id) { return contacts.find(c => c.id === id) ?? null; },
      async create(data) {
        const c: Contact = { ...data, id: uid("c") };
        contacts.push(c);
        return c;
      },
      async update(id, patch) {
        const i = contacts.findIndex(c => c.id === id);
        if (i === -1) return null;
        contacts[i] = { ...contacts[i], ...patch };
        return contacts[i];
      },
    },
    stages: { async list() { return [...stages].sort((a, b) => a.sequence - b.sequence); } },
    users: {
      async list() { return [...users]; },
      async get(id) { return users.find(u => u.id === id) ?? null; },
    },
    activities: {
      async list(p: ListActivitiesParams) {
        return activities.filter(a => {
          if (p.opportunityId && a.opportunityId !== p.opportunityId) return false;
          if (p.assignedTo && a.assignedTo !== p.assignedTo) return false;
          if (p.done !== undefined && a.done !== p.done) return false;
          return true;
        });
      },
      async create(data) {
        const a: Activity = { ...data, id: uid("a") };
        activities.push(a);
        return a;
      },
      async update(id, patch) {
        const i = activities.findIndex(a => a.id === id);
        if (i === -1) return null;
        activities[i] = { ...activities[i], ...patch };
        return activities[i];
      },
    },
    dashboard: {
      async summary(): Promise<DashboardSummary> {
        const today = new Date();
        const month = today.toISOString().slice(0, 7);
        const weekAgo = new Date(today.getTime() - 7 * 864e5).toISOString();

        const pipelineValue = opportunities
          .filter(o => !["s_won", "s_lost"].includes(o.stageId))
          .reduce((sum, o) => sum + o.expectedRevenue, 0);

        const wonThisMonth = opportunities
          .filter(o => o.stageId === "s_won" && o.createdAt.startsWith(month))
          .reduce((s, o) => s + o.expectedRevenue, 0);

        const activitiesToday = activities.filter(a =>
          !a.done && a.scheduledAt.slice(0, 10) === today.toISOString().slice(0, 10)
        ).length;

        const newLeadsThisWeek = opportunities.filter(o => o.createdAt > weekAgo).length;

        const funnel = stages.filter(s => !s.fold).map(s => ({
          stageId: s.id,
          name: s.name,
          count: opportunities.filter(o => o.stageId === s.id).length,
        }));

        const forecast = Array.from({ length: 6 }).map((_, i) => {
          const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
          const key = d.toISOString().slice(0, 7);
          const value = opportunities
            .filter(o => o.expectedClose?.startsWith(key))
            .reduce((sum, o) => sum + o.expectedRevenue * (o.probability / 100), 0);
          return { month: key, value: Math.round(value) };
        });

        const upcomingActivities = activities
          .filter(a => !a.done && a.scheduledAt >= today.toISOString())
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
          .slice(0, 8);

        const recentlyWon = opportunities
          .filter(o => o.stageId === "s_won")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 5);

        return { pipelineValue, wonThisMonth, activitiesToday, newLeadsThisWeek, funnel, forecast, upcomingActivities, recentlyWon };
      },
    },
  };
}
```

- [ ] **Step 4: Enable JSON imports in `tsconfig.json`**

Ensure `"resolveJsonModule": true` is set in `compilerOptions`.

- [ ] **Step 5: Run, expect PASS**

```bash
pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(data): MockDataSource backed by seed JSON"
```

### Task 11: OdooDataSource stub

**Files:**
- Create: `lib/data-source/odoo.ts`

- [ ] **Step 1: Typed stub**

```ts
import type { DataSource } from "./types";

function notImpl(name: string): never {
  throw new Error(`OdooDataSource.${name} not implemented. Use DATA_SOURCE=mock for now.`);
}

export function makeOdooDataSource(): DataSource {
  return {
    opportunities: {
      list: () => notImpl("opportunities.list"),
      get: () => notImpl("opportunities.get"),
      create: () => notImpl("opportunities.create"),
      update: () => notImpl("opportunities.update"),
      remove: () => notImpl("opportunities.remove"),
      changeStage: () => notImpl("opportunities.changeStage"),
    },
    contacts: {
      list: () => notImpl("contacts.list"),
      get: () => notImpl("contacts.get"),
      create: () => notImpl("contacts.create"),
      update: () => notImpl("contacts.update"),
    },
    stages: { list: () => notImpl("stages.list") },
    users: { list: () => notImpl("users.list"), get: () => notImpl("users.get") },
    activities: {
      list: () => notImpl("activities.list"),
      create: () => notImpl("activities.create"),
      update: () => notImpl("activities.update"),
    },
    dashboard: { summary: () => notImpl("dashboard.summary") },
  };
}
```

- [ ] **Step 2: Wire into factory**

Update `lib/data-source/index.ts`:

```ts
import type { DataSource } from "./types";
import { makeMockDataSource } from "./mock";
import { makeOdooDataSource } from "./odoo";

let _cached: DataSource | null = null;

export function getDataSource(): DataSource {
  if (_cached) return _cached;
  const which = process.env.DATA_SOURCE ?? "mock";
  _cached = which === "odoo" ? makeOdooDataSource() : makeMockDataSource();
  return _cached;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(data): Odoo adapter stub behind DATA_SOURCE=odoo"
```

### Task 12: Auth API + session cookie

**Files:**
- Create: `lib/auth/session.ts`, `middleware.ts`
- Create: `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/me/route.ts`

- [ ] **Step 1: `lib/auth/session.ts`**

```ts
import { cookies } from "next/headers";

const COOKIE = "crm_session";
const VALUE = "demo-user";

export async function loginCookie() {
  (await cookies()).set(COOKIE, VALUE, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function logoutCookie() {
  (await cookies()).delete(COOKIE);
}

export async function isAuthed() {
  return (await cookies()).get(COOKIE)?.value === VALUE;
}
```

- [ ] **Step 2: `middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  const session = req.cookies.get("crm_session")?.value;
  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 3: Route `app/api/auth/login/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { loginCookie } from "@/lib/auth/session";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  }
  await loginCookie();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Route `app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from "next/server";
import { logoutCookie } from "@/lib/auth/session";
export async function POST() {
  await logoutCookie();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Route `app/api/me/route.ts`**

```ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    id: "u_demo", name: "Demo User", email: "demo@crm.studio", avatar: "DU",
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(auth): cookie session + middleware + login/logout/me routes"
```

### Task 13: Stages, Users, Contacts routes

**Files:**
- Create: `app/api/stages/route.ts`, `app/api/users/route.ts`, `app/api/contacts/route.ts`, `app/api/contacts/[id]/route.ts`

- [ ] **Step 1: `app/api/stages/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";

export async function GET() {
  const stages = await getDataSource().stages.list();
  return NextResponse.json(stages);
}
```

- [ ] **Step 2: `app/api/users/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";

export async function GET() {
  return NextResponse.json(await getDataSource().users.list());
}
```

- [ ] **Step 3: `app/api/contacts/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { ContactCreate } from "@/lib/schemas/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const isCompanyParam = url.searchParams.get("isCompany");
  const isCompany = isCompanyParam == null ? undefined : isCompanyParam === "true";
  const rows = await getDataSource().contacts.list({ q, isCompany });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = ContactCreate.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  }
  const created = await getDataSource().contacts.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 4: `app/api/contacts/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { ContactPatch } from "@/lib/schemas/core";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getDataSource().contacts.get(id);
  if (!row) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = ContactPatch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const updated = await getDataSource().contacts.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(updated);
}
```

- [ ] **Step 5: Verify via curl**

```bash
pnpm dev &
sleep 2
# Login first to get cookie
curl -c /tmp/c.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@crm.studio","password":"x"}'
curl -b /tmp/c.txt http://localhost:3000/api/stages
curl -b /tmp/c.txt http://localhost:3000/api/contacts | head -c 200
# kill -9 %1 when done
```

Expected: JSON arrays. Kill dev server after verifying.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(api): stages, users, contacts routes"
```

### Task 14: Opportunities routes

**Files:**
- Create: `app/api/opportunities/route.ts`, `app/api/opportunities/[id]/route.ts`, `app/api/opportunities/[id]/stage/route.ts`

- [ ] **Step 1: `app/api/opportunities/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { OpportunityCreate, ListOpportunitiesQuery } from "@/lib/schemas/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = ListOpportunitiesQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const rows = await getDataSource().opportunities.list(parsed.data);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = OpportunityCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const created = await getDataSource().opportunities.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: `app/api/opportunities/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { OpportunityPatch } from "@/lib/schemas/core";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getDataSource().opportunities.get(id);
  if (!row) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = OpportunityPatch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const updated = await getDataSource().opportunities.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await getDataSource().opportunities.remove(id);
  if (!ok) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: `app/api/opportunities/[id]/stage/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { StageChange } from "@/lib/schemas/core";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = StageChange.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const updated = await getDataSource().opportunities.changeStage(id, parsed.data.stageId);
  if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(updated);
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(api): opportunities CRUD + stage change"
```

### Task 15: Activities & Dashboard routes

**Files:**
- Create: `app/api/activities/route.ts`, `app/api/activities/[id]/route.ts`, `app/api/dashboard/summary/route.ts`

- [ ] **Step 1: `app/api/activities/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { ActivityCreate } from "@/lib/schemas/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const opportunityId = url.searchParams.get("opportunityId") ?? undefined;
  const assignedTo = url.searchParams.get("assignedTo") ?? undefined;
  const doneParam = url.searchParams.get("done");
  const done = doneParam == null ? undefined : doneParam === "true";
  const rows = await getDataSource().activities.list({ opportunityId, assignedTo, done });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const parsed = ActivityCreate.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const created = await getDataSource().activities.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: `app/api/activities/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { ActivityPatch } from "@/lib/schemas/core";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = ActivityPatch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const updated = await getDataSource().activities.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(updated);
}
```

- [ ] **Step 3: `app/api/dashboard/summary/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";

export async function GET() {
  return NextResponse.json(await getDataSource().dashboard.summary());
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(api): activities and dashboard summary routes"
```

### Task 16: TanStack Query hooks

**Files:**
- Create: `lib/api-client/fetch.ts`, `lib/api-client/opportunities.ts`, `lib/api-client/contacts.ts`, `lib/api-client/stages.ts`, `lib/api-client/users.ts`, `lib/api-client/activities.ts`, `lib/api-client/dashboard.ts`

- [ ] **Step 1: `lib/api-client/fetch.ts`**

```ts
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}
```

- [ ] **Step 2: `lib/api-client/opportunities.ts`**

```ts
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Opportunity } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useOpportunities(params: { stage?: string; q?: string; salespersonId?: string; tag?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]).toString();
  return useQuery<Opportunity[]>({
    queryKey: ["opportunities", params],
    queryFn: () => api<Opportunity[]>(`/api/opportunities${qs ? `?${qs}` : ""}`),
  });
}

export function useOpportunity(id: string) {
  return useQuery<Opportunity>({
    queryKey: ["opportunity", id],
    queryFn: () => api<Opportunity>(`/api/opportunities/${id}`),
    enabled: !!id,
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Opportunity, "id" | "createdAt">) =>
      api<Opportunity>(`/api/opportunities`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<Omit<Opportunity, "id" | "createdAt">> }) =>
      api<Opportunity>(`/api/opportunities/${args.id}`, { method: "PATCH", body: JSON.stringify(args.patch) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["opportunity", v.id] });
    },
  });
}

export function useChangeStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; stageId: string }) =>
      api<Opportunity>(`/api/opportunities/${args.id}/stage`, { method: "PATCH", body: JSON.stringify({ stageId: args.stageId }) }),
    // optimistic update for kanban drag
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: ["opportunities"] });
      const prev = qc.getQueriesData<Opportunity[]>({ queryKey: ["opportunities"] });
      for (const [key, data] of prev) {
        if (!data) continue;
        qc.setQueryData(key, data.map(o => o.id === args.id ? { ...o, stageId: args.stageId } : o));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.prev) qc.setQueryData(key, data);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
  });
}
```

- [ ] **Step 3: The other hook files — same pattern, keep them minimal**

`lib/api-client/contacts.ts`:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import type { Contact } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useContacts(params: { q?: string; isCompany?: boolean } = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
  ).toString();
  return useQuery<Contact[]>({
    queryKey: ["contacts", params],
    queryFn: () => api<Contact[]>(`/api/contacts${qs ? `?${qs}` : ""}`),
  });
}

export function useContact(id: string) {
  return useQuery<Contact>({
    queryKey: ["contact", id],
    queryFn: () => api<Contact>(`/api/contacts/${id}`),
    enabled: !!id,
  });
}
```

`lib/api-client/stages.ts`:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import type { Stage } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useStages() {
  return useQuery<Stage[]>({ queryKey: ["stages"], queryFn: () => api("/api/stages") });
}
```

`lib/api-client/users.ts`:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useUsers() {
  return useQuery<User[]>({ queryKey: ["users"], queryFn: () => api("/api/users") });
}
```

`lib/api-client/activities.ts`:

```ts
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Activity } from "@/lib/schemas/core";
import { api } from "./fetch";

export function useActivities(params: { opportunityId?: string; done?: boolean } = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
  ).toString();
  return useQuery<Activity[]>({
    queryKey: ["activities", params],
    queryFn: () => api<Activity[]>(`/api/activities${qs ? `?${qs}` : ""}`),
  });
}

export function useToggleActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; done: boolean }) =>
      api<Activity>(`/api/activities/${args.id}`, { method: "PATCH", body: JSON.stringify({ done: args.done }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
  });
}
```

`lib/api-client/dashboard.ts`:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import type { DashboardSummary } from "@/lib/data-source/types";
import { api } from "./fetch";

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({ queryKey: ["dashboard"], queryFn: () => api("/api/dashboard/summary") });
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(api-client): TanStack Query hooks for all resources"
```

---

## Phase 3: Screens

### Task 17: Login screen

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/layout.tsx`

- [ ] **Step 1: `app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen grid place-items-center bg-bg">{children}</div>;
}
```

- [ ] **Step 2: `app/(auth)/login/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login failed");
      router.push("/dashboard");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-[380px] bg-surface border border-border rounded-lg p-8 space-y-5">
      <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /><span className="font-semibold">CRM Studio</span></div>
      <div>
        <div className="text-lg font-medium">Welcome back</div>
        <div className="text-sm text-text-muted">Sign in to your workspace</div>
      </div>
      <div className="space-y-3">
        <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="demo@crm.studio" /></div>
        <div><Label>Password</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
      </div>
      <button
        type="button"
        className="text-xs text-text-muted hover:text-text"
        onClick={() => { setEmail("demo@crm.studio"); setPassword("demo"); }}
      >Use demo credentials</button>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
```

- [ ] **Step 3: Verify**

`pnpm dev`, visit `/login`, fill demo creds, submit → redirects to `/dashboard` with shell rendered.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(auth): login screen"
```

### Task 18: Dashboard screen

**Files:**
- Create: `app/(app)/dashboard/page.tsx`, `components/dashboard/stat-tile.tsx`, `components/dashboard/funnel-chart.tsx`, `components/dashboard/forecast-chart.tsx`, `components/dashboard/upcoming-activities.tsx`, `components/dashboard/recently-won.tsx`

- [ ] **Step 1: `components/dashboard/stat-tile.tsx`**

```tsx
export function StatTile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}
```

- [ ] **Step 2: `components/dashboard/funnel-chart.tsx`**

```tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

export function FunnelChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 h-[280px]">
      <div className="text-sm font-medium mb-3">Pipeline funnel</div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: `components/dashboard/forecast-chart.tsx`**

```tsx
"use client";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";

export function ForecastChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 h-[280px]">
      <div className="text-sm font-medium mb-3">Weighted forecast (next 6 months)</div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--accent-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <Area type="monotone" dataKey="value" stroke="var(--accent-2)" fill="url(#grad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: `components/dashboard/upcoming-activities.tsx`**

```tsx
import type { Activity } from "@/lib/schemas/core";
import { Phone, Mail, Calendar, CheckSquare } from "lucide-react";
import { format } from "date-fns";

const ICON = { call: Phone, email: Mail, meeting: Calendar, todo: CheckSquare };

export function UpcomingActivities({ items }: { items: Activity[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="text-sm font-medium mb-3">Your next activities</div>
      <ul className="space-y-2">
        {items.map(a => {
          const Icon = ICON[a.type];
          return (
            <li key={a.id} className="flex items-center gap-3 text-sm">
              <Icon className="h-4 w-4 text-accent" />
              <div className="flex-1">{a.summary}</div>
              <div className="text-xs text-text-muted">{format(new Date(a.scheduledAt), "MMM d, HH:mm")}</div>
            </li>
          );
        })}
        {items.length === 0 && <li className="text-sm text-text-muted">Nothing upcoming.</li>}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: `components/dashboard/recently-won.tsx`**

```tsx
import type { Opportunity } from "@/lib/schemas/core";

export function RecentlyWon({ items }: { items: Opportunity[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="text-sm font-medium mb-3">Recently won</div>
      <ul className="space-y-2">
        {items.map(o => (
          <li key={o.id} className="flex items-center gap-3 text-sm">
            <span className="flex-1 truncate">{o.name}</span>
            <span className="text-success">{o.currency} {o.expectedRevenue.toLocaleString()}</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-text-muted">No wins yet.</li>}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: `app/(app)/dashboard/page.tsx`**

```tsx
"use client";
import { useDashboardSummary } from "@/lib/api-client/dashboard";
import { StatTile } from "@/components/dashboard/stat-tile";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { ForecastChart } from "@/components/dashboard/forecast-chart";
import { UpcomingActivities } from "@/components/dashboard/upcoming-activities";
import { RecentlyWon } from "@/components/dashboard/recently-won";

const fmt = (n: number, cur = "EUR") => new Intl.NumberFormat("en-GB", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();
  if (isLoading || !data) return <div className="p-6 text-text-muted">Loading…</div>;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatTile label="Pipeline value" value={fmt(data.pipelineValue)} />
        <StatTile label="Won this month" value={fmt(data.wonThisMonth)} />
        <StatTile label="Activities today" value={data.activitiesToday} />
        <StatTile label="New leads this week" value={data.newLeadsThisWeek} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunnelChart data={data.funnel} />
        <ForecastChart data={data.forecast} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingActivities items={data.upcomingActivities} />
        <RecentlyWon items={data.recentlyWon} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(dashboard): stats, funnel, forecast, activities, recent wins"
```

### Task 19: Pipeline (Kanban) with drag-and-drop

**Files:**
- Create: `app/(app)/pipeline/page.tsx`, `components/kanban/board.tsx`, `components/kanban/column.tsx`, `components/kanban/card.tsx`, `components/kanban/filters.tsx`, `components/kanban/create-sheet.tsx`
- Test: `components/kanban/board.test.tsx`

- [ ] **Step 1: `components/kanban/card.tsx`**

```tsx
"use client";
import type { Opportunity, Contact } from "@/lib/schemas/core";
import { Star } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

export function KanbanCard({ opp, contact, dragging }: { opp: Opportunity; contact?: Contact; dragging?: boolean }) {
  const initial = contact?.name?.[0] ?? "?";
  return (
    <div className={clsx(
      "bg-surface border border-border rounded-md p-3 space-y-2 text-sm",
      "border-l-[3px]",
      dragging && "opacity-50"
    )} style={{ borderLeftColor: "var(--accent)" }}>
      <Link href={`/opportunities/${opp.id}`} className="font-medium block hover:underline">{opp.name}</Link>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="h-5 w-5 rounded-full bg-surface-muted grid place-items-center text-[10px]">{initial}</span>
        <span className="truncate">{contact?.name ?? "—"}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span>{opp.currency} {opp.expectedRevenue.toLocaleString()}</span>
        <div className="flex">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star key={i} className={clsx("h-3 w-3", i < opp.priority ? "text-warning fill-warning" : "text-text-muted")} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `components/kanban/column.tsx`**

```tsx
"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Opportunity, Stage, Contact } from "@/lib/schemas/core";
import { KanbanCard } from "./card";

function DraggableCard({ opp, contact }: { opp: Opportunity; contact?: Contact }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: opp.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard opp={opp} contact={contact} dragging={isDragging} />
    </div>
  );
}

export function KanbanColumn({ stage, opps, contactsById }: { stage: Stage; opps: Opportunity[]; contactsById: Map<string, Contact> }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = opps.reduce((s, o) => s + o.expectedRevenue, 0);
  return (
    <div ref={setNodeRef} className={`min-w-[280px] bg-surface-muted/40 border border-border rounded-lg p-3 flex flex-col gap-2 ${isOver ? "ring-2 ring-accent" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs uppercase tracking-wide text-text-muted">{stage.name}</div>
        <div className="text-xs text-text-muted">{opps.length} · {total.toLocaleString()} €</div>
      </div>
      <SortableContext items={opps.map(o => o.id)} strategy={verticalListSortingStrategy}>
        {opps.map(o => <DraggableCard key={o.id} opp={o} contact={contactsById.get(o.partnerId)} />)}
      </SortableContext>
    </div>
  );
}
```

- [ ] **Step 3: `components/kanban/board.tsx`**

```tsx
"use client";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { Opportunity, Stage, Contact } from "@/lib/schemas/core";
import { KanbanColumn } from "./column";

export function KanbanBoard({ stages, opportunities, contacts, onDrop }: {
  stages: Stage[]; opportunities: Opportunity[]; contacts: Contact[];
  onDrop: (opportunityId: string, stageId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const contactsById = new Map(contacts.map(c => [c.id, c]));

  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over) return;
    const stageId = String(e.over.id);
    const opp = opportunities.find(o => o.id === e.active.id);
    if (!opp || opp.stageId === stageId) return;
    onDrop(opp.id, stageId);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto p-1">
        {stages.filter(s => !s.fold).map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            opps={opportunities.filter(o => o.stageId === stage.id)}
            contactsById={contactsById}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 4: Test the drag handler logic**

`components/kanban/board.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KanbanBoard } from "./board";
import type { Opportunity, Stage, Contact } from "@/lib/schemas/core";

const stages: Stage[] = [
  { id: "s_new", name: "New", sequence: 1, fold: false },
  { id: "s_won", name: "Won", sequence: 2, fold: false },
];
const contacts: Contact[] = [{ id: "c1", name: "Acme", isCompany: true, parentId: null, email: "", phone: "", title: null, city: "", country: "", tags: [] }];
const opps: Opportunity[] = [
  { id: "o1", name: "Acme — Website", partnerId: "c1", salespersonId: "u1", stageId: "s_new",
    expectedRevenue: 1000, probability: 10, currency: "EUR", tags: [], priority: 1,
    createdAt: "2026-04-01T00:00:00Z", expectedClose: null, description: "" },
];

describe("KanbanBoard", () => {
  it("renders stage columns and cards", () => {
    const onDrop = vi.fn();
    render(<KanbanBoard stages={stages} opportunities={opps} contacts={contacts} onDrop={onDrop} />);
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Won")).toBeInTheDocument();
    expect(screen.getByText("Acme — Website")).toBeInTheDocument();
  });
});
```

Run: `pnpm test`. Expected: PASS.

- [ ] **Step 5: `components/kanban/filters.tsx`**

```tsx
"use client";
import type { Stage, User } from "@/lib/schemas/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function KanbanFilters({
  stages, users, stage, salesperson, onChange,
}: {
  stages: Stage[]; users: User[];
  stage?: string; salesperson?: string;
  onChange: (patch: { stage?: string; salesperson?: string }) => void;
}) {
  return (
    <div className="flex gap-2">
      <Select value={stage ?? "all"} onValueChange={v => onChange({ stage: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stage" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={salesperson ?? "all"} onValueChange={v => onChange({ salesperson: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Salesperson" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everyone</SelectItem>
          {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 6: `components/kanban/create-sheet.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStages } from "@/lib/api-client/stages";
import { useUsers } from "@/lib/api-client/users";
import { useContacts } from "@/lib/api-client/contacts";
import { useCreateOpportunity } from "@/lib/api-client/opportunities";
import { toast } from "sonner";

export function CreateOpportunitySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const stages = useStages().data ?? [];
  const users = useUsers().data ?? [];
  const contacts = useContacts({ isCompany: true }).data ?? [];
  const create = useCreateOpportunity();

  const [form, setForm] = useState({
    name: "", partnerId: "", salespersonId: "", stageId: "",
    expectedRevenue: 0, probability: 10, currency: "EUR" as "EUR" | "USD" | "DKK",
    tags: [] as string[], priority: 1 as 0 | 1 | 2 | 3,
    expectedClose: null as string | null, description: "",
  });

  const submit = async () => {
    try {
      await create.mutateAsync(form);
      toast.success("Opportunity created");
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[460px]">
        <SheetHeader><SheetTitle>New opportunity</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Contact</Label>
            <Select value={form.partnerId} onValueChange={v => setForm({ ...form, partnerId: v })}>
              <SelectTrigger><SelectValue placeholder="Pick a company" /></SelectTrigger>
              <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Salesperson</Label>
            <Select value={form.salespersonId} onValueChange={v => setForm({ ...form, salespersonId: v })}>
              <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
              <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Stage</Label>
            <Select value={form.stageId} onValueChange={v => setForm({ ...form, stageId: v })}>
              <SelectTrigger><SelectValue placeholder="Pick a stage" /></SelectTrigger>
              <SelectContent>{stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Expected revenue</Label><Input type="number" value={form.expectedRevenue} onChange={e => setForm({ ...form, expectedRevenue: Number(e.target.value) })} /></div>
          <Button onClick={submit} disabled={create.isPending} className="w-full">{create.isPending ? "Saving…" : "Create"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 7: `app/(app)/pipeline/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { KanbanBoard } from "@/components/kanban/board";
import { KanbanFilters } from "@/components/kanban/filters";
import { CreateOpportunitySheet } from "@/components/kanban/create-sheet";
import { Button } from "@/components/ui/button";
import { useOpportunities, useChangeStage } from "@/lib/api-client/opportunities";
import { useStages } from "@/lib/api-client/stages";
import { useUsers } from "@/lib/api-client/users";
import { useContacts } from "@/lib/api-client/contacts";
import { Plus } from "lucide-react";

export default function PipelinePage() {
  const [stage, setStage] = useState<string>();
  const [salesperson, setSalesperson] = useState<string>();
  const [sheetOpen, setSheetOpen] = useState(false);

  const stages = useStages().data ?? [];
  const users = useUsers().data ?? [];
  const opps = useOpportunities({ stage, salespersonId: salesperson }).data ?? [];
  const contacts = useContacts().data ?? [];
  const changeStage = useChangeStage();

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <div className="flex items-center gap-2">
          <KanbanFilters stages={stages} users={users} stage={stage} salesperson={salesperson}
            onChange={p => { if (p.stage !== undefined) setStage(p.stage); if (p.salesperson !== undefined) setSalesperson(p.salesperson); }} />
          <Button onClick={() => setSheetOpen(true)}><Plus className="h-4 w-4 mr-1" />New</Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <KanbanBoard
          stages={stages}
          opportunities={opps}
          contacts={contacts}
          onDrop={(id, stageId) => changeStage.mutate({ id, stageId })}
        />
      </div>
      <CreateOpportunitySheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
```

- [ ] **Step 8: Smoke-test in browser**

Run `pnpm dev`, login, visit `/pipeline`. Drag a card to another column — it moves, Network tab shows `PATCH /api/opportunities/:id/stage`, page reload preserves the new stage.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(pipeline): kanban board with drag-to-stage"
```

### Task 20: Opportunities list

**Files:**
- Create: `app/(app)/opportunities/page.tsx`, `components/tables/opportunities-table.tsx`, `components/tables/opp-filters.tsx`

- [ ] **Step 1: `components/tables/opportunities-table.tsx`**

```tsx
"use client";
import Link from "next/link";
import type { Opportunity, Contact, Stage, User } from "@/lib/schemas/core";
import { Badge } from "@/components/ui/badge";

export function OpportunitiesTable({ rows, contactsById, stagesById, usersById }: {
  rows: Opportunity[];
  contactsById: Map<string, Contact>;
  stagesById: Map<string, Stage>;
  usersById: Map<string, User>;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted/40 text-text-muted">
          <tr>
            <Th>Opportunity</Th><Th>Contact</Th><Th>Stage</Th>
            <Th className="text-right">Expected</Th><Th>Prob.</Th><Th>Salesperson</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(o => (
            <tr key={o.id} className="border-t border-border hover:bg-surface-muted/30">
              <td className="px-4 py-2"><Link href={`/opportunities/${o.id}`} className="hover:underline">{o.name}</Link></td>
              <td className="px-4 py-2">{contactsById.get(o.partnerId)?.name ?? "—"}</td>
              <td className="px-4 py-2"><Badge variant="secondary">{stagesById.get(o.stageId)?.name}</Badge></td>
              <td className="px-4 py-2 text-right">{o.currency} {o.expectedRevenue.toLocaleString()}</td>
              <td className="px-4 py-2">{o.probability}%</td>
              <td className="px-4 py-2">{usersById.get(o.salespersonId)?.name}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No results.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left text-xs font-medium uppercase tracking-wide px-4 py-2 ${className}`}>{children}</th>;
}
```

- [ ] **Step 2: `components/tables/opp-filters.tsx`**

```tsx
"use client";
import type { Stage, User } from "@/lib/schemas/core";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function OppFilters({ stages, users, value, onChange }: {
  stages: Stage[]; users: User[];
  value: { stage?: string; salespersonId?: string; q?: string };
  onChange: (patch: Partial<{ stage?: string; salespersonId?: string; q?: string }>) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Input placeholder="Search…" value={value.q ?? ""} onChange={e => onChange({ q: e.target.value || undefined })} className="w-[240px]" />
      <Select value={value.stage ?? "all"} onValueChange={v => onChange({ stage: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stage" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.salespersonId ?? "all"} onValueChange={v => onChange({ salespersonId: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Salesperson" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everyone</SelectItem>
          {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 3: `app/(app)/opportunities/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { OpportunitiesTable } from "@/components/tables/opportunities-table";
import { OppFilters } from "@/components/tables/opp-filters";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useStages } from "@/lib/api-client/stages";
import { useUsers } from "@/lib/api-client/users";
import { useContacts } from "@/lib/api-client/contacts";

export default function OpportunitiesPage() {
  const [filters, setFilters] = useState<{ stage?: string; salespersonId?: string; q?: string }>({});
  const stages = useStages().data ?? [];
  const users = useUsers().data ?? [];
  const contacts = useContacts().data ?? [];
  const rows = useOpportunities(filters).data ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Opportunities</h1>
        <OppFilters stages={stages} users={users} value={filters} onChange={p => setFilters(f => ({ ...f, ...p }))} />
      </div>
      <OpportunitiesTable
        rows={rows}
        contactsById={new Map(contacts.map(c => [c.id, c]))}
        stagesById={new Map(stages.map(s => [s.id, s]))}
        usersById={new Map(users.map(u => [u.id, u]))}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(opportunities): list view with filters"
```

### Task 21: Opportunity detail page

**Files:**
- Create: `app/(app)/opportunities/[id]/page.tsx`, `components/detail/stage-pills.tsx`, `components/detail/activity-timeline.tsx`, `components/detail/log-activity.tsx`

- [ ] **Step 1: `components/detail/stage-pills.tsx`**

```tsx
"use client";
import type { Stage } from "@/lib/schemas/core";
import clsx from "clsx";

export function StagePills({ stages, currentId, onChange }: {
  stages: Stage[]; currentId: string; onChange: (id: string) => void;
}) {
  const open = stages.filter(s => !s.fold);
  const currentIdx = open.findIndex(s => s.id === currentId);
  return (
    <div className="flex gap-1">
      {open.map((s, i) => {
        const active = i <= currentIdx;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={clsx(
              "px-3 py-1.5 text-xs rounded-md border",
              active ? "bg-accent text-[color:var(--bg)] border-accent" : "bg-surface border-border text-text-muted hover:text-text"
            )}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: `components/detail/activity-timeline.tsx`**

```tsx
"use client";
import type { Activity, User } from "@/lib/schemas/core";
import { Phone, Mail, Calendar, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const ICON = { call: Phone, email: Mail, meeting: Calendar, todo: CheckSquare };

export function ActivityTimeline({ activities, usersById, onToggle }: {
  activities: Activity[];
  usersById: Map<string, User>;
  onToggle: (id: string, done: boolean) => void;
}) {
  const sorted = [...activities].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  return (
    <ul className="space-y-3">
      {sorted.map(a => {
        const Icon = ICON[a.type];
        return (
          <li key={a.id} className="flex items-start gap-3">
            <span className="mt-0.5 h-7 w-7 rounded-full bg-surface-muted grid place-items-center"><Icon className="h-3.5 w-3.5 text-accent" /></span>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className={a.done ? "line-through text-text-muted" : ""}>{a.summary}</span>
                <span className="text-xs text-text-muted">· {format(new Date(a.scheduledAt), "MMM d")}</span>
                <span className="text-xs text-text-muted">· {usersById.get(a.assignedTo)?.name ?? "—"}</span>
              </div>
            </div>
            <Checkbox checked={a.done} onCheckedChange={v => onToggle(a.id, !!v)} />
          </li>
        );
      })}
      {sorted.length === 0 && <li className="text-sm text-text-muted">No activities.</li>}
    </ul>
  );
}
```

- [ ] **Step 3: `components/detail/log-activity.tsx`**

```tsx
"use client";
import { useState } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ActivityType } from "@/lib/schemas/core";

export function LogActivityMenu({ onPick }: { onPick: (t: "call" | "meeting" | "email" | "todo") => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Log activity</Button></DropdownMenuTrigger>
      <DropdownMenuContent>
        {(["call", "meeting", "email", "todo"] as const).map(t => (
          <DropdownMenuItem key={t} onClick={() => onPick(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 4: `app/(app)/opportunities/[id]/page.tsx`**

```tsx
"use client";
import { use } from "react";
import Link from "next/link";
import { useOpportunity, useUpdateOpportunity, useChangeStage } from "@/lib/api-client/opportunities";
import { useStages } from "@/lib/api-client/stages";
import { useUsers } from "@/lib/api-client/users";
import { useContact } from "@/lib/api-client/contacts";
import { useActivities, useToggleActivity } from "@/lib/api-client/activities";
import { StagePills } from "@/components/detail/stage-pills";
import { ActivityTimeline } from "@/components/detail/activity-timeline";
import { LogActivityMenu } from "@/components/detail/log-activity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client/fetch";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const opp = useOpportunity(id).data;
  const stages = useStages().data ?? [];
  const users = useUsers().data ?? [];
  const contact = useContact(opp?.partnerId ?? "").data;
  const activities = useActivities({ opportunityId: id }).data ?? [];
  const update = useUpdateOpportunity();
  const changeStage = useChangeStage();
  const toggleActivity = useToggleActivity();

  if (!opp) return <div className="p-6 text-text-muted">Loading…</div>;

  const salesperson = users.find(u => u.id === opp.salespersonId);

  const logActivity = async (type: "call" | "meeting" | "email" | "todo") => {
    await api("/api/activities", {
      method: "POST",
      body: JSON.stringify({
        opportunityId: id,
        type,
        summary: `New ${type}`,
        scheduledAt: new Date().toISOString(),
        done: false,
        assignedTo: opp.salespersonId,
      }),
    });
    await qc.invalidateQueries({ queryKey: ["activities"] });
    toast.success(`${type} logged`);
  };

  const markWon = () => changeStage.mutate({ id, stageId: "s_won" });
  const markLost = () => changeStage.mutate({ id, stageId: "s_lost" });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/opportunities" className="hover:text-text">Opportunities</Link><span>/</span><span className="text-text">{opp.name}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{opp.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-text-muted">
            <Link href={contact ? `/contacts?focus=${contact.id}` : "#"} className="hover:text-text">{contact?.name ?? "—"}</Link>
            <span>·</span><span>{opp.currency} {opp.expectedRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={markWon}>Mark won</Button>
          <Button variant="outline" onClick={markLost}>Mark lost</Button>
        </div>
      </div>

      <StagePills stages={stages} currentId={opp.stageId} onChange={stageId => changeStage.mutate({ id, stageId })} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="bg-surface border border-border rounded-lg p-5">
            <div className="text-sm font-medium mb-2">Description</div>
            <p className="text-sm whitespace-pre-line">{opp.description || <span className="text-text-muted">No description.</span>}</p>
          </section>
          <section className="bg-surface border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Activities</div>
              <LogActivityMenu onPick={logActivity} />
            </div>
            <ActivityTimeline
              activities={activities}
              usersById={new Map(users.map(u => [u.id, u]))}
              onToggle={(aid, done) => toggleActivity.mutate({ id: aid, done })}
            />
          </section>
        </div>
        <aside className="space-y-4">
          <section className="bg-surface border border-border rounded-lg p-5 space-y-3">
            <Row label="Expected revenue" value={`${opp.currency} ${opp.expectedRevenue.toLocaleString()}`} />
            <Row label="Probability" value={`${opp.probability}%`} />
            <Row label="Salesperson" value={salesperson?.name ?? "—"} />
            <Row label="Expected close" value={opp.expectedClose ?? "—"} />
            <Row label="Tags" value={<div className="flex gap-1 flex-wrap">{opp.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}</div>} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between text-sm gap-4">
      <span className="text-text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(opportunities): detail page with stage pills, activities, actions"
```

### Task 22: Contacts screen

**Files:**
- Create: `app/(app)/contacts/page.tsx`, `components/contacts/contact-list.tsx`, `components/contacts/contact-detail.tsx`

- [ ] **Step 1: `components/contacts/contact-list.tsx`**

```tsx
"use client";
import type { Contact } from "@/lib/schemas/core";
import clsx from "clsx";
import { Building2, User } from "lucide-react";

export function ContactList({ contacts, selectedId, onSelect, query, onQuery }: {
  contacts: Contact[]; selectedId?: string;
  onSelect: (id: string) => void;
  query: string; onQuery: (q: string) => void;
}) {
  const companies = contacts.filter(c => c.isCompany);
  const people = contacts.filter(c => !c.isCompany);
  const byParent = new Map<string, Contact[]>();
  for (const p of people) {
    if (!p.parentId) continue;
    byParent.set(p.parentId, [...(byParent.get(p.parentId) ?? []), p]);
  }
  return (
    <div className="w-[320px] shrink-0 border-r border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <input
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Search contacts…"
          className="w-full bg-surface-muted rounded-md px-3 py-1.5 text-sm outline-none"
        />
      </div>
      <div className="flex-1 overflow-auto">
        {companies.map(c => (
          <div key={c.id}>
            <button
              onClick={() => onSelect(c.id)}
              className={clsx("w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-surface-muted/50",
                selectedId === c.id && "bg-surface-muted")}
            >
              <Building2 className="h-4 w-4 text-accent" /><span className="truncate">{c.name}</span>
            </button>
            {(byParent.get(c.id) ?? []).map(p => (
              <button key={p.id} onClick={() => onSelect(p.id)}
                className={clsx("w-full flex items-center gap-2 pl-9 pr-3 py-1.5 text-xs text-left text-text-muted hover:text-text hover:bg-surface-muted/50",
                  selectedId === p.id && "bg-surface-muted text-text")}>
                <User className="h-3 w-3" /><span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `components/contacts/contact-detail.tsx`**

```tsx
"use client";
import type { Contact, Opportunity, Activity } from "@/lib/schemas/core";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function ContactDetail({ contact, opportunities, activities }: {
  contact: Contact;
  opportunities: Opportunity[];
  activities: Activity[];
}) {
  return (
    <div className="flex-1 p-6 overflow-auto space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{contact.name}</h2>
        <div className="text-sm text-text-muted mt-0.5">
          {contact.title ? `${contact.title} · ` : ""}{contact.city}, {contact.country}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <Field label="Email" value={contact.email} />
        <Field label="Phone" value={contact.phone} />
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Linked opportunities</div>
        <ul className="space-y-1">
          {opportunities.map(o => (
            <li key={o.id} className="text-sm">
              <Link href={`/opportunities/${o.id}`} className="hover:underline">{o.name}</Link>
              <span className="text-text-muted"> · {o.currency} {o.expectedRevenue.toLocaleString()}</span>
            </li>
          ))}
          {opportunities.length === 0 && <li className="text-sm text-text-muted">None yet.</li>}
        </ul>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Recent activity</div>
        <ul className="space-y-1 text-sm">
          {activities.slice(0, 5).map(a => <li key={a.id}>{a.summary} <span className="text-text-muted">· {a.type}</span></li>)}
          {activities.length === 0 && <li className="text-text-muted">No activities.</li>}
        </ul>
      </div>

      <div className="flex gap-1 flex-wrap">
        {contact.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs uppercase text-text-muted">{label}</div><div className="text-sm">{value}</div></div>;
}
```

- [ ] **Step 3: `app/(app)/contacts/page.tsx`**

```tsx
"use client";
import { useMemo, useState } from "react";
import { useContacts } from "@/lib/api-client/contacts";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useActivities } from "@/lib/api-client/activities";
import { ContactList } from "@/components/contacts/contact-list";
import { ContactDetail } from "@/components/contacts/contact-detail";

export default function ContactsPage() {
  const [query, setQuery] = useState("");
  const contacts = useContacts({ q: query || undefined }).data ?? [];
  const [selectedId, setSelectedId] = useState<string>();
  const selected = contacts.find(c => c.id === (selectedId ?? contacts[0]?.id));

  const oppsAll = useOpportunities().data ?? [];
  const actsAll = useActivities().data ?? [];
  const opps = useMemo(() => selected ? oppsAll.filter(o => o.partnerId === selected.id) : [], [oppsAll, selected]);
  const acts = useMemo(() => selected ? actsAll.filter(a => opps.some(o => o.id === a.opportunityId)) : [], [actsAll, opps, selected]);

  return (
    <div className="h-full flex">
      <ContactList contacts={contacts} selectedId={selected?.id} onSelect={setSelectedId} query={query} onQuery={setQuery} />
      {selected
        ? <ContactDetail contact={selected} opportunities={opps} activities={acts} />
        : <div className="flex-1 grid place-items-center text-text-muted">Pick a contact</div>}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(contacts): split-view list + detail"
```

### Task 23: Activities screen

**Files:**
- Create: `app/(app)/activities/page.tsx`

- [ ] **Step 1: `app/(app)/activities/page.tsx`**

```tsx
"use client";
import { useActivities, useToggleActivity } from "@/lib/api-client/activities";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useUsers } from "@/lib/api-client/users";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Phone, Mail, Calendar, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { format, isToday, isPast, parseISO, startOfDay } from "date-fns";
import clsx from "clsx";

const ICON = { call: Phone, email: Mail, meeting: Calendar, todo: CheckSquare };

export default function ActivitiesPage() {
  const acts = useActivities().data ?? [];
  const opps = useOpportunities().data ?? [];
  const users = useUsers().data ?? [];
  const toggle = useToggleActivity();
  const oppsById = new Map(opps.map(o => [o.id, o]));
  const usersById = new Map(users.map(u => [u.id, u]));

  const today = acts.filter(a => !a.done && isToday(parseISO(a.scheduledAt)));
  const upcoming = acts.filter(a => !a.done && parseISO(a.scheduledAt) > startOfDay(new Date()));

  const groupedUpcoming = upcoming.reduce<Record<string, typeof acts>>((acc, a) => {
    const key = a.scheduledAt.slice(0, 10);
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  const Row = ({ a }: { a: (typeof acts)[number] }) => {
    const Icon = ICON[a.type];
    const overdue = !a.done && isPast(parseISO(a.scheduledAt));
    return (
      <div className="flex items-center gap-3 py-2 border-b border-border text-sm">
        <Checkbox checked={a.done} onCheckedChange={v => toggle.mutate({ id: a.id, done: !!v })} />
        <Icon className="h-4 w-4 text-accent" />
        <span className={clsx("flex-1", a.done && "line-through text-text-muted")}>{a.summary}</span>
        {overdue && <span className="text-xs text-danger">overdue</span>}
        <Link href={`/opportunities/${a.opportunityId}`} className="text-xs text-text-muted hover:text-text truncate max-w-[200px]">
          {oppsById.get(a.opportunityId)?.name}
        </Link>
        <span className="text-xs text-text-muted w-[100px] text-right">{usersById.get(a.assignedTo)?.name}</span>
        <span className="text-xs text-text-muted w-[80px] text-right">{format(parseISO(a.scheduledAt), "HH:mm")}</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Activities</h1>
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
          <TabsTrigger value="upcoming">All upcoming ({upcoming.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <div className="bg-surface border border-border rounded-lg p-4">
            {today.length === 0 ? <div className="text-sm text-text-muted">Nothing scheduled for today.</div> : today.map(a => <Row key={a.id} a={a} />)}
          </div>
        </TabsContent>
        <TabsContent value="upcoming">
          <div className="space-y-3">
            {Object.entries(groupedUpcoming).sort().map(([day, list]) => (
              <div key={day} className="bg-surface border border-border rounded-lg p-4">
                <div className="text-xs uppercase text-text-muted mb-2">{format(parseISO(day), "EEEE, MMM d")}</div>
                {list.map(a => <Row key={a.id} a={a} />)}
              </div>
            ))}
            {upcoming.length === 0 && <div className="text-sm text-text-muted">Nothing upcoming.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(activities): today + upcoming with quick-complete"
```

---

## Phase 4: Polish

### Task 24: cmd+k command palette

**Files:**
- Modify: `components/command-palette/command-palette.tsx`
- Create: `components/command-palette/use-global-shortcut.ts`

- [ ] **Step 1: `components/command-palette/use-global-shortcut.ts`**

```ts
"use client";
import { useEffect } from "react";

export function useCmdK(onOpen: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onOpen]);
}
```

- [ ] **Step 2: Replace `components/command-palette/command-palette.tsx`**

```tsx
"use client";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useContacts } from "@/lib/api-client/contacts";
import { useCmdK } from "./use-global-shortcut";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const opps = useOpportunities().data ?? [];
  const contacts = useContacts().data ?? [];
  useCmdK(() => onOpenChange(true));

  const go = (path: string) => { onOpenChange(false); router.push(path); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[560px]">
        <Command className="bg-surface">
          <CommandInput placeholder="Jump to…" className="w-full px-4 py-3 bg-transparent outline-none border-b border-border text-sm" />
          <CommandList className="max-h-[380px] overflow-auto p-2">
            <CommandEmpty className="px-3 py-6 text-sm text-text-muted text-center">No matches.</CommandEmpty>
            <CommandGroup heading="Opportunities">
              {opps.slice(0, 8).map(o => (
                <CommandItem key={o.id} onSelect={() => go(`/opportunities/${o.id}`)}
                  className="px-3 py-2 rounded-md text-sm data-[selected=true]:bg-surface-muted cursor-pointer">
                  {o.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Contacts">
              {contacts.slice(0, 8).map(c => (
                <CommandItem key={c.id} onSelect={() => go(`/contacts`)}
                  className="px-3 py-2 rounded-md text-sm data-[selected=true]:bg-surface-muted cursor-pointer">
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify**

`pnpm dev`, log in, press cmd+k anywhere in the app — palette opens, typing a company name filters, selecting jumps.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(palette): cmd+k global search"
```

### Task 25: Playwright happy-path E2E

**Files:**
- Create: `playwright.config.ts`, `e2e/happy-path.spec.ts`
- Modify: `package.json` — add `"test:e2e": "playwright test"`

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3000", headless: true, trace: "on-first-retry" },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: Install Playwright browsers**

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 3: `e2e/happy-path.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("login → pipeline → drag card → persists", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Use demo credentials" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("link", { name: "Pipeline" }).click();
  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();

  // Wait for the first opportunity card to appear
  const firstCard = page.locator("a[href^='/opportunities/']").first();
  await firstCard.waitFor();
  const cardText = await firstCard.innerText();

  // Drag the first card into the Won column
  const wonColumn = page.locator("text=WON").locator("..").locator("..");
  await firstCard.dragTo(wonColumn);

  // Reload and verify the card is still in Won
  await page.reload();
  await expect(wonColumn.getByText(cardText)).toBeVisible();
});
```

- [ ] **Step 4: Add script to `package.json`**

```json
"test:e2e": "playwright test"
```

- [ ] **Step 5: Run**

```bash
pnpm test:e2e
```

Expected: PASS. If it flakes on the drag (dnd-kit is timing-sensitive under Playwright), increase `activationConstraint.distance` or add a small wait before reload.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(e2e): happy-path Playwright test"
```

### Task 26: README, scripts, developer docs

**Files:**
- Replace: `README.md`

- [ ] **Step 1: Write full README**

```markdown
# Odoo CRM — Clickable Mockup

Pitch-ready, reusable prototype of an Odoo CRM "skin". Built with Next.js 15, TypeScript, Tailwind (CSS-variable themes), shadcn/ui, TanStack Query, @dnd-kit.

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Login with any credentials (or click "Use demo credentials").

## Stack

- Next.js 15 app router, React 19, TypeScript
- Tailwind CSS with CSS-variable driven themes (4 presets + live Custom slot)
- shadcn/ui primitives in `components/ui/`
- TanStack Query for data
- @dnd-kit for kanban drag-and-drop
- Zod for schema validation (shared client + server)

## Architecture

All reads and writes go through the `DataSource` interface (`lib/data-source/types.ts`). Two implementations:

- `MockDataSource` — in-memory, seeded from `data/seed/*.json`. Default.
- `OdooDataSource` — typed stub, to be implemented when real Odoo credentials are provided.

Swap with the env var:

```
DATA_SOURCE=mock     # default
DATA_SOURCE=odoo     # when implemented
```

## Scripts

| | |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright happy-path |
| `pnpm lint` | ESLint |

## Design doc

See `docs/superpowers/specs/2026-04-20-odoo-crm-clickable-mockup-design.md`.

## Deploying

Easiest path: push to a GitHub repo, import to Vercel, select the repo, deploy. No env vars required for the mock mode.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: full README"
```

---

## Self-review

Before handing off, run through:

1. **Spec coverage:** All 7 screens, theme switcher with 4 presets + custom slot, mock API mirroring Odoo fields, DataSource interface, seed data, login with cookie, cmd+k palette, Playwright E2E — all present.
2. **Placeholder scan:** No "TBD" or vague steps. The seed JSON generation is prescriptive about counts + structure but delegates the actual values to the executing engineer; this is intentional — spelling out every row would be noise.
3. **Type consistency:** `Opportunity.stageId` used consistently, `changeStage(id, stageId)` matches `PATCH /api/opportunities/:id/stage` body shape, `DashboardSummary` shape matches what the dashboard UI reads.
4. **Ambiguity:** Theme CSS variable names match between `apply.ts` and `tailwind.config.ts`. Middleware path matcher excludes `/login` but includes `/api/*` (except `/api/auth/login`) — correct.

Plan is ready.
