# AI Widget Builder — Sketch

**Date:** 2026-04-21
**Status:** Sketch — react, then we brainstorm → spec → plan

## Goal

Let an **admin** describe a dashboard widget in plain English; an LLM produces a typed JSON spec; the spec renders deterministically from a fixed widget catalog; admin previews, approves, and publishes it to the dashboard. All widgets respect the active theme (CSS variables) for free.

## User flow

1. Admin opens **Dashboard → Widget Studio** (new tab on `/dashboard` alongside Pipeline health / My tasks).
2. Types: *"Monthly deals won grouped by salesperson, last 6 months."*
3. LLM returns a widget spec (JSON). Live preview renders on the right, using real mock API data.
4. Admin can tweak fields manually (which data source, which aggregation, chart type) — spec is editable.
5. Click **Save draft** → lands in a drafts list.
6. Click **Submit for review** → moves to pending (anyone with the share link sees read-only preview).
7. Admin clicks **Approve & publish** → widget appears on the dashboard in a "Custom widgets" section below the built-ins.

## Widget DSL (example)

```json
{
  "id": "w_won_by_rep_6mo",
  "type": "bar_chart",
  "title": "Won deals by salesperson · 6 months",
  "dataSource": "opportunities",
  "filter": { "stage": "s_won", "createdAfter": "now-6mo" },
  "groupBy": "salespersonId",
  "metric": { "agg": "sum", "field": "expectedRevenue" },
  "orientation": "vertical",
  "showLegend": false
}
```

A single `WidgetRenderer` component reads the spec and renders a shadcn-styled chart using `var(--accent)`, `var(--text)`, etc. — theme comes along automatically.

## Starter widget catalog (6 types)

| Type | Purpose |
|---|---|
| `stat_tile` | Single big number (sum / count / avg of a field) |
| `bar_chart` | Count or metric grouped by a dimension |
| `line_chart` | Metric over time (day / week / month buckets) |
| `pie_chart` | Share of total across categories |
| `record_table` | Top-N rows of a resource with chosen columns |
| `activity_feed` | Filtered list of activities (overdue / today / by assignee) |

Each has a Zod schema. The LLM's output is Zod-parsed; invalid specs are retried or surfaced as an error.

## Lifecycle

```
  draft ──► pending_review ──► approved ──► published ──► archived
                │                                 ▲
                └────────── (admin rejects) ──────┘
```

- Only **admin** can transition to `approved` / `published`.
- Any logged-in user can view a `pending_review` widget via share link (read-only preview).
- `published` widgets appear on the dashboard for everyone.
- `archived` removes from dashboard but keeps in history for audit.

## LLM wiring

- **Claude API** via `@anthropic-ai/sdk`.
- Key: `ANTHROPIC_API_KEY` env var. Default = A18N key locally; swap for a Cema-Consult / client key at deploy.
- System prompt includes: widget catalog definitions, Zod schemas of all data sources (`opportunities`, `contacts`, `stages`, `activities`, `users`), current theme tokens (for color hints), and strict output format = JSON-only matching the widget schema.
- Tool use to force JSON output (one of the 6 widget schemas).

## Storage

- **Pitch (this repo):** widgets live in `MockDataSource` alongside the rest — a new in-memory array `widgets: WidgetSpec[]`. Survives for the life of the Node process. Add `/api/widgets`, `/api/widgets/:id`, `/api/widgets/:id/transition` routes.
- **Production:** same API shape, backed by Postgres. `WidgetSpec` is already schema-defined, so only the `DataSource` implementation changes.

## Dashboard integration

A third tab **"Custom widgets"** on `/dashboard` (alongside Pipeline health / My tasks), showing all `published` widgets in a responsive grid. Empty state encourages admin to build one.

## Permissions (prototype)

- One hardcoded role switch: `role: "admin" | "viewer"` on the user object.
- Viewers: read published + own drafts + anything they have a share link to.
- Admins: full CRUD + transition.
- (Real RBAC comes later; this is enough for the pitch demo.)

## Out of scope (this first cut)

- Editing generated widgets with natural language ("make the bars orange") — v1 only supports prompt-then-manual-tweak.
- Custom JS/TSX widgets.
- Multi-user review comments; approval is a single admin click.
- Scheduled / auto-refreshing widgets.
- Drill-down from widget to detail view.
- Widget export / import between workspaces.

## Open questions for you

1. **Widget placement** — separate "Custom widgets" tab vs interleaved with built-ins? I'd say separate tab for the pitch (clearer story).
2. **Share-for-review UX** — email a link, copy a URL, or a "Request review from [user]" dropdown populated from the seed users?
3. **Rate limits / cost guardrails** — cap generations per admin per day? Log each prompt + cost in a small audit trail?
4. **Default on first load** — should the widget studio start blank, or with a "Try one of these prompts" gallery of 3-4 examples?

## Rough scope

If we go ahead: probably **10-14 tasks** (Zod widget DSL, renderer, LLM route handler with schema-forcing tool use, CRUD API, drafts/pending/published states, studio page with prompt + preview, manual edit form, approve/publish flow, dashboard tab integration, + seed demo widgets for the pitch).
