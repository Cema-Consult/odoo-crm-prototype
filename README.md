# Odoo CRM — Clickable Mockup

Pitch-ready prototype of an Odoo CRM "skin". A custom-branded Next.js frontend driven by a mock REST API shaped like Odoo's CRM models, so a real Odoo adapter can drop in later without touching the UI.

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Login with any email + password (or click **"Use demo credentials"**).

## What's inside

- **7 screens:** Login, Dashboard, Pipeline (kanban drag-and-drop), Opportunities list + detail, Contacts, Activities
- **4 theme presets:** Midnight, Ember, Forest, Odoo Dark — plus a live Custom slot that accepts hex values during a demo
- **⌘K global palette** — jump to any opportunity or contact by name
- **Mock REST API** — all reads/writes go through `/api/*` route handlers backed by in-memory seed data (30 deals, 60 contacts, 80 activities)

## Stack

- Next.js 16 (app router), React 19, TypeScript
- Tailwind CSS v4 with CSS custom-property themes (`app/globals.css`)
- shadcn/ui primitives owned in `components/ui/` (built on `@base-ui/react`)
- TanStack Query for data fetching + optimistic updates
- @dnd-kit for kanban drag-and-drop
- Zod schemas shared between route handlers and the client
- Vitest + jsdom for unit tests; Playwright for the one happy-path E2E

## Architecture

All data flows through the `DataSource` interface (`lib/data-source/types.ts`). Two implementations:

- `MockDataSource` — in-memory singleton seeded from `data/seed/*.json`. **Default.**
- `OdooDataSource` — typed stub; implement when real Odoo credentials arrive.

Swap by setting the env var:

```
DATA_SOURCE=mock     # default
DATA_SOURCE=odoo     # once the adapter is implemented
```

Every API route handler looks the same:

```ts
const ds = getDataSource();
const rows = await ds.opportunities.list(params);
return Response.json(rows);
```

The frontend never knows (or cares) whether it's talking to mock or real data.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server at http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm test` | Vitest unit tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | Playwright happy-path test |
| `pnpm lint` | ESLint |

## Project layout

```
app/
  (auth)/login/                 login screen
  (app)/                        AppShell-wrapped routes
    dashboard/
    pipeline/                   kanban board
    opportunities/ [id]/
    contacts/
    activities/
  api/
    auth/login/ logout/
    me/
    stages/ users/
    contacts/ [id]/
    opportunities/ [id]/ [id]/stage/
    activities/ [id]/
    dashboard/summary/
components/
  shell/                        sidebar, topbar, theme switcher, user menu
  kanban/                       board, column, card, filters, create sheet
  tables/                       opportunities table + filters
  detail/                       stage pills, activity timeline, log-activity menu
  contacts/                     list + detail panel
  dashboard/                    stat tile, funnel chart, forecast chart, upcoming, recently won
  command-palette/              cmd+k palette + global shortcut
  ui/                           shadcn primitives
lib/
  theme/                        presets, token applier, ThemeProvider
  schemas/                      Zod schemas for every domain type
  data-source/                  DataSource interface + MockDataSource + Odoo stub + factory
  api-client/                   TanStack Query hooks (one file per resource)
  auth/                         cookie session helpers
data/seed/                      demo dataset — don't ship to prod as-is
e2e/                            Playwright specs
```

## Design doc

See [`docs/superpowers/specs/2026-04-20-odoo-crm-clickable-mockup-design.md`](docs/superpowers/specs/2026-04-20-odoo-crm-clickable-mockup-design.md) for the brainstormed design.

See [`docs/superpowers/plans/2026-04-20-odoo-crm-clickable-mockup.md`](docs/superpowers/plans/2026-04-20-odoo-crm-clickable-mockup.md) for the task-by-task implementation plan this project was built from.

## Deploying

**Vercel (recommended for the pitch)**

1. Push this repo to GitHub (will live under the `Cema-Consult` org).
2. Import the repo into Vercel. No env vars required — `DATA_SOURCE=mock` is the default.
3. Every push to `main` auto-deploys.

Why Vercel and not Cloudflare? The `MockDataSource` is an in-memory singleton — a single long-lived Node process preserves its state across requests. Cloudflare Workers isolate each request, so kanban drag-drop wouldn't visually persist. If the client wants Cloudflare post-sale, back `MockDataSource` with Cloudflare KV or Durable Objects.

**Environment variables** (when moving past the pitch)

- `DATA_SOURCE` — `mock` (default) or `odoo`
- Add Odoo-specific vars (`ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_PASSWORD` or API key) when implementing `OdooDataSource`

## Known limitations (pitch prototype)

- Mock data resets when the Node process restarts (intentional — clean state for each pitch)
- No mobile layouts (desktop-first; degrades below 1024px)
- No file uploads, email/calendar integration, multi-currency conversion, or real auth
- Playwright suite is a single happy-path test, not full coverage

## License

Private. © Cema-Consult ApS.
