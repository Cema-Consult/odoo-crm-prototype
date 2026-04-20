# Odoo CRM — Clickable Mockup Prototype

**Date:** 2026-04-20
**Status:** Draft — awaiting user review
**Scope:** CRM module only. Invoicing will be spec'd in a separate cycle after this one ships.

## Purpose

Build a clickable mockup of an Odoo CRM "skin" — a custom-branded frontend that consumes a mock API shaped like Odoo's CRM models. Two goals, equally weighted:

1. **Pitch artifact.** The client can demo it as "this is what your Odoo-powered CRM could look like under our brand."
2. **Reusable foundation.** The code survives past the pitch — when the client signs, we swap the mock data source for a real Odoo adapter without touching the frontend.

## Success criteria

- All 7 screens are navigable and visually polished in the chosen visual direction.
- Theme switcher works: 4 presets (Midnight, Ember, Forest, Odoo Dark) + a Custom slot where 4 hex values (bg, surface, accent, text) can be pasted live during the pitch.
- Kanban drag-and-drop updates stage via a real HTTP call to the mock API (visible in devtools Network tab).
- A `DataSource` interface cleanly isolates the mock layer, so an `OdooDataSource` implementation can be dropped in later without frontend changes.
- A demo-ready seed dataset (companies, deals, contacts, activities) makes the pitch feel real without any "Lorem ipsum".

## Non-goals

- Real Odoo integration — the `OdooDataSource` is stubbed only, not implemented.
- User authentication — login accepts anything, sets a fake cookie, and routes to the dashboard. No password rules, no recovery flow, no roles.
- Mobile layouts — desktop-first for the pitch. Responsive breakpoints are not required; screens may degrade below 1024px.
- File uploads / attachments.
- Email / calendar integration.
- Multi-company, multi-currency edge cases (display currency is stored per opportunity; conversion is out of scope).
- Persistence across server restarts — mock data resets when Node restarts (can be upgraded later).
- Invoicing / Accounting module (separate spec).

## Tech stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15, app router, TypeScript | Component reuse, mock route handlers, clean migration path to a full app |
| Styling | Tailwind CSS driven by CSS custom properties | Theme switcher flips CSS variables, no stylesheet swap |
| Components | shadcn/ui (owned in-repo) | Customizable primitives, not a locked-in library |
| Data fetching | TanStack Query | Cache, optimistic updates for kanban drag |
| Drag-and-drop | @dnd-kit | Kanban card between stages |
| Validation | Zod | One schema shared between route handler (parse) and client (infer) |
| Icons | lucide-react | Matches shadcn defaults |
| Package manager | pnpm | Faster installs, smaller disk footprint |

## Architecture

### Directory layout

```
app/
  (auth)/login/              → login screen
  (app)/                     → layout = AppShell (sidebar + topbar)
    dashboard/
    pipeline/                → kanban
    opportunities/
    opportunities/[id]/      → detail page
    contacts/
    activities/
  api/
    auth/login/
    opportunities/           → GET, POST
    opportunities/[id]/      → GET, PATCH, DELETE
    opportunities/[id]/stage → PATCH
    contacts/
    contacts/[id]/
    stages/
    activities/
    activities/[id]/
    dashboard/summary/
    me/
components/
  shell/                     → AppShell, Sidebar, Topbar, ThemeSwitcher
  kanban/                    → Board, Column, Card, CreateSheet
  tables/                    → OpportunitiesTable, ContactsList
  detail/                    → OpportunityDetail, ActivityTimeline
  dashboard/                 → StatTile, FunnelChart, ForecastChart
  command-palette/           → cmd+k search
  ui/                        → shadcn primitives
lib/
  data-source/
    types.ts                 → DataSource interface + domain types
    mock.ts                  → MockDataSource (in-memory singleton)
    odoo.ts                  → OdooDataSource (stub only)
    index.ts                 → factory reading DATA_SOURCE env var
  schemas/                   → Zod schemas (shared client + server)
  theme/                     → preset definitions, CSS variable application
  api-client/                → thin fetch wrapper with TanStack Query hooks
data/
  seed/
    opportunities.json
    contacts.json
    stages.json
    activities.json
    users.json
```

### Integration seam

Every API route handler looks identical in shape:

```ts
// app/api/opportunities/route.ts
export async function GET(req: Request) {
  const ds = getDataSource();
  const params = listQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const rows = await ds.opportunities.list(params);
  return Response.json(rows);
}
```

`getDataSource()` reads `DATA_SOURCE` env (`mock` | `odoo`) and returns the matching implementation. For the prototype, only `MockDataSource` exists; `OdooDataSource` is scaffolded as a typed stub with `throw new Error("Not implemented")` bodies so TypeScript enforces contract parity when someone implements it later.

## Data model

Field names mirror Odoo's `crm.lead` / `res.partner` / `crm.stage` / `mail.activity` models so the future `OdooDataSource` adapter stays thin.

```ts
type Opportunity = {
  id: string;
  name: string;              // e.g. "Acme Corp — Website redesign"
  partnerId: string;         // → Contact
  salespersonId: string;     // → User
  stageId: string;           // → Stage
  expectedRevenue: number;
  probability: number;       // 0-100
  currency: "EUR" | "USD" | "DKK";
  tags: string[];
  priority: 0 | 1 | 2 | 3;   // Odoo's star rating
  createdAt: string;         // ISO
  expectedClose: string | null;
  description: string;       // markdown
};

type Contact = {
  id: string;
  name: string;
  isCompany: boolean;
  parentId: string | null;   // individuals linked to their company
  email: string;
  phone: string;
  title: string | null;
  city: string;
  country: string;
  tags: string[];
};

type Stage = { id: string; name: string; sequence: number; fold: boolean };

type Activity = {
  id: string;
  opportunityId: string;
  type: "call" | "meeting" | "email" | "todo";
  summary: string;
  scheduledAt: string;       // ISO
  done: boolean;
  assignedTo: string;        // → User
};

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;            // URL or initials-based
};
```

## API contract

All JSON over HTTP. Validation with Zod. Auth cookie is required on every endpoint except `/api/auth/login`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Any email + password → sets `session` cookie |
| `GET` | `/api/me` | Current user |
| `GET` | `/api/opportunities?stage=&q=&tag=&salespersonId=` | List with filters |
| `POST` | `/api/opportunities` | Create |
| `GET` | `/api/opportunities/:id` | Single |
| `PATCH` | `/api/opportunities/:id` | Partial update |
| `DELETE` | `/api/opportunities/:id` | Delete |
| `PATCH` | `/api/opportunities/:id/stage` | Kanban drag → `{ stageId }` |
| `GET` | `/api/contacts?q=&isCompany=` | List |
| `POST` | `/api/contacts` | Create |
| `GET` / `PATCH` | `/api/contacts/:id` | Read / update |
| `GET` | `/api/stages` | Kanban columns, ordered by `sequence` |
| `GET` | `/api/users` | Salespeople list (for filters + assignment pickers) |
| `GET` | `/api/activities?opportunityId=&assignedTo=&done=` | List |
| `POST` | `/api/activities` | Create |
| `PATCH` | `/api/activities/:id` | Mark done / reschedule |
| `GET` | `/api/dashboard/summary` | Pipeline value, won this month, forecast, today's activities |

## Screens

### 1. Login — `/login`
Centered card on dark canvas. Email + password + "Sign in". Accepts anything → sets cookie → redirects to `/dashboard`. A "Use demo credentials" chip auto-fills the form for the pitch.

### 2. Dashboard — `/dashboard`
- **Top:** 4 stat tiles (Pipeline value, Won this month, Activities today, New leads this week)
- **Middle:** Funnel bar chart (count per stage) + Revenue forecast area chart
- **Bottom:** "My next activities" table + "Recently won" list
- Everything read from `GET /api/dashboard/summary`

### 3. Pipeline — `/pipeline`
- Columns = stages from `/api/stages`, ordered by `sequence`
- Cards show: name, company initial, expected revenue, priority stars, salesperson avatar, open-activities badge
- Drag between columns → `PATCH /api/opportunities/:id/stage` (optimistic update via TanStack Query)
- Top bar: stage filter, salesperson filter, `+ New` button opens a create-deal sheet (shadcn `Sheet`)

### 4. Opportunities list — `/opportunities`
- shadcn DataTable
- Columns: name, contact, stage, expected revenue, probability, next activity, salesperson
- Filter sidebar: stage, tag, salesperson, revenue range
- Row click → `/opportunities/[id]`

### 5. Opportunity detail — `/opportunities/[id]`
- Two-column layout
- **Left (primary):** name, stage progress pills (clickable to advance), contact block, markdown description, activity timeline, notes
- **Right (sidebar):** expected revenue, probability slider, tags, salesperson, expected close, "Log activity" dropdown (call / meeting / email / todo)
- **Top bar:** `Mark Won` / `Mark Lost` action buttons

### 6. Contacts — `/contacts`
- Split view: filterable list on the left (companies + individuals with indentation under parent), detail panel on the right (info, linked deals, activity feed)
- Toggle between card and list view

### 7. Activities — `/activities`
- Two tabs: "Today" (grouped by time of day) and "All upcoming" (grouped by day)
- Each row: type icon, summary, linked opportunity, salesperson, overdue badge
- Quick-complete checkbox → `PATCH /api/activities/:id`

### Global patterns
- **cmd+k palette** — jump to any opportunity or contact by typing name
- **Breadcrumbs** on detail pages
- **Create actions use side sheets** — preserves context, never navigates away

## Theme system

Four preset themes + a Custom slot. Implementation:

1. `lib/theme/presets.ts` defines each preset as a flat object:
   ```ts
   type ThemePreset = { bg: string; surface: string; surfaceMuted: string; border: string; text: string; textMuted: string; accent: string; accent2: string; accent3: string; success: string; danger: string; warning: string };
   ```
2. `ThemeProvider` applies the active preset to `<html>` as CSS custom properties (`--bg`, `--surface`, etc.). Tailwind config references them via `var(--bg)`.
3. Theme choice persists to `localStorage`. No flash on first paint: the provider reads the saved theme during the initial server render (from a cookie mirror set on change).
4. The "Custom" slot lives in the theme-switcher popover: 4 hex inputs. Typing a hex updates CSS variables immediately. "Save as preset" copies the current values into a named slot held in `localStorage`.

### Preset palettes

| Preset | bg | surface | accent | accent2 | accent3 |
|---|---|---|---|---|---|
| Midnight | `#0F172A` | `#1E293B` | `#38BDF8` | `#A78BFA` | `#4ADE80` |
| Ember | `#1C1917` | `#292524` | `#F97316` | `#EC4899` | `#FBBF24` |
| Forest | `#0C1612` | `#14261F` | `#10B981` | `#22D3EE` | `#FCD34D` |
| Odoo Dark | `#17121D` | `#2A1F33` | `#B585A6` | `#E91E63` | `#00A09D` |

## Mock data strategy

- `MockDataSource` loads seed JSON files once on first access and holds arrays in a module-level singleton.
- Mutations persist for the life of the Node process. Restart = fresh data. This is intentional — the pitch never runs long enough to drift, and a clean restart is a reliable "reset to demo state."
- Seed data must feel real: ~30 opportunities, ~20 company contacts + ~40 individual contacts linked to them, ~80 activities distributed across deals with realistic dates (some overdue, some today, some upcoming). Deal names follow a `<Company> — <Project>` pattern; revenue values spread €5k–€180k; currencies mixed; priorities and tags varied.
- Stages are the Odoo defaults: New → Qualified → Proposition → Won (with a "Lost" fold stage).
- No "Lorem ipsum" anywhere — it undermines the pitch.

## Error handling

- **API errors:** Route handlers return `{ error: { code, message } }` with matching HTTP status. TanStack Query surfaces errors to toast notifications (shadcn `Sonner`).
- **Validation:** Zod parse failures return `400` with the field-level errors for form surfacing.
- **404 on detail pages:** Next.js `notFound()` → branded 404 screen with nav back to the list.
- **Auth:** Missing cookie on any `/api/*` except `/api/auth/login` → `401` → client redirects to `/login`.

## Testing strategy

Scaled to a pitch prototype, not a production app.

- **Unit:** Zod schemas (encode/decode roundtrip on known fixtures). MockDataSource list/create/update/delete behavior.
- **Component:** Kanban drag handlers (jsdom simulated). Theme switcher applies expected CSS variables.
- **E2E:** One happy-path Playwright test: login → view pipeline → drag card → see it moved after reload. This one test catches >80% of regressions for a demo.
- **No coverage targets.** If a line of logic is load-bearing for the demo, it gets a test. If it isn't, it doesn't.

## Open decisions (deferred)

- **Hosting.** Three candidates: Vercel free tier (shareable URL, recommended), local-only with `npm run dev`, or collapsing the mock API into client-side TS + static export. Decide before shipping.
- **Custom theme persistence across browsers.** Currently localStorage only. If the client wants their custom palette to follow them across devices, we'd need a server-side store — out of scope for the prototype.
- **Sample company branding.** What fake company name headlines the demo (logo + wordmark in the sidebar)? "Acme" is fine but lazy; a better placeholder makes the pitch crisper.

## Implementation plan

Authored separately after this spec is approved. Broadly, six chunks:

1. Project scaffold + Tailwind + shadcn + theme system + AppShell
2. `DataSource` interface, mock implementation, seed data, Zod schemas, all API routes
3. Pipeline + kanban drag-and-drop
4. Opportunities list + detail page + activities sub-components
5. Contacts + Dashboard
6. Login, cmd+k palette, theme switcher with Custom slot, Playwright happy-path test, polish pass
