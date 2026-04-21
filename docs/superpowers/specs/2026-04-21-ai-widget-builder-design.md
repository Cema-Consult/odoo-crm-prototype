# AI Widget Builder — Design Spec

**Date:** 2026-04-21
**Status:** Approved sketch — ready for writing-plans
**Related:** [Sketch](../../sketches/2026-04-21-ai-widget-builder-sketch.md)

## Purpose

Give an **admin** a natural-language widget builder for the dashboard. Admin types a prompt; Claude returns a typed JSON widget spec drawn from a fixed catalog; a deterministic renderer displays it. Admin previews, tweaks, approves, and publishes. All widgets inherit the active theme via CSS variables.

## Success criteria

1. Admin can generate a working chart or list in < 10 seconds from a one-sentence prompt.
2. Generated widgets honor the current theme preset with zero extra work.
3. Admin can manually override any field in the generated spec before publishing.
4. Share-for-review produces a copyable URL that renders a read-only preview.
5. A `DataSource` migration path exists: prototype stores widgets in `MockDataSource`; a future `OdooDataSource.widgets` implementation uses the same interface.

## Non-goals

- Editing widgets via natural language (v1 is prompt-then-manual-tweak).
- Custom JS/TSX widgets — catalog-only.
- Multi-user review comments; single-admin approval only.
- Scheduled or auto-refreshing widgets.
- Drill-down from widget to record detail.
- Export / import between workspaces.
- Widget resize / drag-to-reorder on the dashboard (fixed grid in v1).

## Decisions (confirmed)

| Question | Answer |
|---|---|
| Widget placement | Separate **"Custom widgets"** tab on `/dashboard` |
| Review sharing | Copyable URL, read-only render |
| Rate limits / generation caps | None for v1 |
| First-load UX | Gallery of 3-4 starter prompts |
| Data fields available to AI | All schemas (opportunities, contacts, stages, activities, users). Admin can manually edit any field. |
| LLM key | `ANTHROPIC_API_KEY` env var — A18N key locally, swap at deploy |
| Approver | Admin only |

## User flow

1. Admin lands on `/dashboard`, clicks the **Custom widgets** tab.
2. Empty state → "Open Widget Studio" button, plus the 4-prompt gallery.
3. **Widget Studio** opens in a full-page dialog (or dedicated `/dashboard/studio` route):
   - Left pane: prompt input + example gallery + manual edit form
   - Right pane: live preview rendered against real seed data
4. Admin types or picks a prompt → **Generate** → Claude returns a spec → renderer paints preview.
5. Admin can hand-edit any field in the form (type, title, data source, filter, metric, etc.) — preview re-renders.
6. Three terminal actions: **Save draft** / **Submit for review** / **Approve & publish**.
7. Drafts + pending appear in a list on the Custom widgets tab (admin sees all; viewers see only ones they have a share URL to).
8. **Approve & publish** → widget appears in the Custom widgets grid.

## Widget DSL

A single discriminated union. Each variant has its own Zod schema.

```ts
type WidgetSpec =
  | StatTile
  | BarChart
  | LineChart
  | PieChart
  | RecordTable
  | ActivityFeed;

type Common = {
  id: string;
  title: string;
  description?: string;
  state: "draft" | "pending_review" | "published" | "archived";
  createdBy: string;  // userId
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  prompt?: string;    // original NL input for audit
};

type DataSourceKey = "opportunities" | "contacts" | "activities";
type Agg = "sum" | "avg" | "count" | "min" | "max";
type Bucket = "day" | "week" | "month" | "stage" | "salesperson" | "tag" | "priority" | "type" | "isCompany" | "country";

type Filter = {
  stage?: string | string[];
  salespersonId?: string | string[];
  priority?: number | number[];
  done?: boolean;
  tag?: string | string[];
  type?: string | string[];    // activity type
  createdAfter?: string;        // ISO or "now-6mo" / "now-30d"
  createdBefore?: string;
  isCompany?: boolean;
};

type StatTile = Common & {
  type: "stat_tile";
  dataSource: DataSourceKey;
  metric: { agg: Agg; field: string } | { agg: "count" };
  filter?: Filter;
  compareTo?: "previous_period" | null;  // delta indicator
};

type BarChart = Common & {
  type: "bar_chart";
  dataSource: DataSourceKey;
  groupBy: Bucket;
  metric: { agg: Agg; field: string } | { agg: "count" };
  filter?: Filter;
  orientation?: "vertical" | "horizontal";
};

type LineChart = Common & {
  type: "line_chart";
  dataSource: DataSourceKey;
  timeField: "createdAt" | "scheduledAt" | "expectedClose";
  bucket: "day" | "week" | "month";
  metric: { agg: Agg; field: string } | { agg: "count" };
  filter?: Filter;
};

type PieChart = Common & {
  type: "pie_chart";
  dataSource: DataSourceKey;
  groupBy: Bucket;
  metric: { agg: Agg; field: string } | { agg: "count" };
  filter?: Filter;
};

type RecordTable = Common & {
  type: "record_table";
  dataSource: DataSourceKey;
  columns: string[];
  filter?: Filter;
  sortBy?: { field: string; dir: "asc" | "desc" };
  limit?: number;  // default 10
};

type ActivityFeed = Common & {
  type: "activity_feed";
  filter: Filter;
  groupBy?: "day" | "assignee" | null;
  limit?: number;
};
```

All variants share a Zod schema. The LLM emits a JSON object matching one variant; the route handler parses with `z.discriminatedUnion("type", ...)`.

## Renderer

One component, `<WidgetRenderer spec={...} />`, switches on `spec.type`. Each branch uses the existing TanStack Query hooks (`useOpportunities`, `useContacts`, `useActivities`) to fetch raw data, then a pure function `aggregate(spec, rows)` computes the values. Charts use recharts with `var(--accent)` / `var(--accent-2)` / `var(--text)` etc.

Client-side aggregation is intentional for v1:
- Small dataset (30-80 records)
- Zero extra API work
- Clean migration path: when scale demands, replace `aggregate()` with `/api/query` that calls `ds.query.aggregate(spec)` → in `OdooDataSource`, translates to `read_group`.

## LLM integration

- `@anthropic-ai/sdk` package
- Model: `claude-opus-4-7` for quality on the generation task
- Tool use with a single tool per widget type (6 tools) or one `emit_widget` tool whose input schema is the discriminated union. Tool-use forces valid JSON.
- System prompt includes:
  - Widget catalog with semantic descriptions
  - All 5 data schemas (`opportunities`, `contacts`, `stages`, `activities`, `users`) with field names + types
  - Current theme tokens (so the model can suggest sensible defaults)
  - Today's date (important for "last 6 months" style phrases)
- On schema parse failure: retry once with the Zod error appended to the user message. If still invalid, return `400 { error: { code: "BAD_SPEC", message } }` and surface in the Studio UI.
- Prompt + cost logged to a small in-memory `widgetAuditLog` for the prototype (not surfaced in UI yet).

## API additions

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/widgets/generate` | Body: `{ prompt: string }`. Calls Claude, validates, returns draft spec (no persistence). |
| `GET` | `/api/widgets?state=` | List widgets, optionally filtered by state. |
| `POST` | `/api/widgets` | Persist a (possibly hand-edited) spec as a draft. |
| `GET` | `/api/widgets/:id` | Read one widget. |
| `PATCH` | `/api/widgets/:id` | Update spec or state transitions. Admin-only for state → `approved`/`published`. |
| `DELETE` | `/api/widgets/:id` | Archive (soft delete). |

Middleware already gates `/api/*` behind auth. New route handlers check `user.role === "admin"` for transitions.

## Storage

- Extend `MockDataSource` with a `widgets` collection (in-memory array, no seed on first run).
- `DataSource` interface gets a new `widgets` section with list/get/create/update/remove plus `transition(id, nextState)`.
- `OdooDataSource` stub grows stubs for the same methods.
- Prod migration: Postgres table with the same shape. No frontend change.

## Permissions

- `User` schema gains `role: "admin" | "viewer"` (default `"viewer"`).
- Seed: `u_anna` flipped to `"admin"` for the demo; the other 4 stay `"viewer"`. Adjust when a proper user-switcher is added.
- Route handler + UI both check role before showing admin-only controls.

## Dashboard integration

- `/dashboard` gets a third tab **Custom widgets**.
- Tab renders a responsive grid: `grid grid-cols-1 md:grid-cols-2 gap-4`.
- Each cell is a `<WidgetRenderer spec={widget} />` wrapped in a card with title + 3-dot menu (Edit / Duplicate / Archive — admin only).
- Empty state: illustration + "Open Widget Studio" button + the 4-prompt gallery.

## Widget Studio

- Route: `/dashboard/studio` (admin-only; non-admins get a 404 page from the route handler, with a link back to `/dashboard`).
- Layout: two-column. Left = input + form. Right = live preview + "Use real data" / "Use sample data" toggle (v1 always real).
- Top bar: title + breadcrumb (`Dashboard › Custom widgets › Studio`) + state pill (`Draft` / `Pending` / `Published`).
- Actions (bottom bar): `Save draft` / `Submit for review` / `Approve & publish` / `Copy review link` / `Archive`.

### Example prompts (first-load gallery)

Shown as 4 clickable cards in the empty state:

1. **"Deals won this quarter by salesperson"**
2. **"Pipeline value by stage"**
3. **"My overdue activities this week"**
4. **"Revenue forecast for the next 3 months"**

Clicking a card fills the prompt textarea and auto-generates.

## Share-for-review

- `Copy review link` in the Studio action bar copies `${origin}/dashboard/widget/:id?ro=1`.
- That route renders `<WidgetRenderer spec={widget} />` standalone with a "Review: <title>" header and no action bar. Only works for widgets in `pending_review` or `published` state.
- Share link bypasses role check (anyone authenticated can view) but is read-only — no mutation endpoints respond to non-admin cookies.

## Testing

- Zod schema roundtrips for each widget variant.
- `aggregate()` pure function unit tests covering every (dataSource, agg, groupBy) combination in use.
- Mock the Anthropic SDK in tests; verify that `/api/widgets/generate` parses valid JSON, retries on parse failure, and returns 400 after second failure.
- One Playwright extension: admin generates a widget from the gallery → edits the title → publishes → it appears on the dashboard.

## Open defaults I picked (flag if wrong)

- Model: `claude-opus-4-7` (high quality, higher cost). Could drop to `claude-sonnet-4-6` to save tokens; opus reads better in a demo.
- Aggregation happens client-side from existing hooks (rationale above).
- Admin user = `u_anna` in seed data.
- Custom widgets grid = 2 columns on desktop.
- Widget IDs = `w_<nanoid>` generated client-side.

## Rough scope

**12 tasks** across 4 phases:
- **Phase 1 — Data layer (3):** widget Zod schemas + discriminated union; extend `MockDataSource` + `DataSource` interface; add `role` to user schema + seed.
- **Phase 2 — API + LLM (3):** CRUD routes; `/generate` route with Anthropic tool use + retry; role-check helper.
- **Phase 3 — Renderer + aggregation (2):** `aggregate()` pure function + tests; `<WidgetRenderer>` with 6 variant branches.
- **Phase 4 — UI (4):** Widget Studio page (left/right panes, form, gallery); dashboard Custom widgets tab; review share route; empty + loading states.

**Estimate:** ~2-3 hours of agent time at the pace we hit earlier.
