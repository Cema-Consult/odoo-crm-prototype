# AI Widget Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only "Widget Studio" where a natural-language prompt produces a typed JSON widget spec via Claude, is previewed against real data, and can be published to a new "Custom widgets" tab on the dashboard.

**Architecture:** Widgets are a discriminated union of 6 Zod-schema'd variants, stored in `MockDataSource` for now (with a matching `OdooDataSource` stub). A single `<WidgetRenderer>` switches on `spec.type`. Aggregation runs client-side via a pure `aggregate(spec, rows)` function fed by existing TanStack Query hooks. A `/api/widgets/generate` route calls Claude via `@anthropic-ai/sdk` tool use and retries once on parse failure. Admin-only transitions gate `approved` / `published`.

**Tech Stack:** `@anthropic-ai/sdk`, `nanoid`, Zod discriminated unions, existing TanStack Query, shadcn/ui Tabs/Dialog/Button/Input/Select/Textarea, recharts, React 19.

**Spec:** [docs/superpowers/specs/2026-04-21-ai-widget-builder-design.md](../specs/2026-04-21-ai-widget-builder-design.md)

---

## File plan

```
lib/
  schemas/
    widgets.ts                   — Zod discriminated union + types
    widgets.test.ts              — roundtrip + rejection tests
  data-source/
    types.ts                     — MODIFY: add `widgets` section
    mock.ts                      — MODIFY: add widgets store
    odoo.ts                      — MODIFY: add stubs
  api-client/
    widgets.ts                   — TanStack Query hooks
  widgets/
    aggregate.ts                 — pure aggregation
    aggregate.test.ts
    renderer.tsx                 — <WidgetRenderer>
    example-prompts.ts           — 4 starter prompt cards
  auth/
    role.ts                      — requireAdmin helper
app/
  api/widgets/
    route.ts                     — GET list, POST create
    [id]/route.ts                — GET / PATCH / DELETE
    [id]/transition/route.ts     — PATCH next state (admin-only)
    generate/route.ts            — POST prompt → spec (admin-only)
  (app)/dashboard/
    page.tsx                     — MODIFY: third "Custom widgets" tab
    studio/page.tsx              — Widget Studio (admin-only)
    widget/[id]/page.tsx         — Share review (read-only)
components/widgets/
  custom-widgets-grid.tsx        — grid used in tab + share
  studio-editor.tsx              — manual edit form (variant-aware)
  example-gallery.tsx            — 4 starter prompt cards
```

---

## Phase 1 — Data layer

### Task 1: Install deps + add `role` to User

**Files:**
- Modify: `package.json` (deps)
- Modify: `lib/schemas/core.ts` (User schema gains `role`)
- Modify: `data/seed/users.json` (flip `u_anna` to admin)

- [ ] **Step 1: Install runtime deps**

```bash
pnpm add @anthropic-ai/sdk nanoid
```

Expected: success, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Extend `User` schema in `lib/schemas/core.ts`**

Locate the `User` schema block and replace:

```ts
export const Role = z.enum(["admin", "viewer"]);
export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  avatar: z.string(),
  role: Role.default("viewer"),
});
```

Also export the type alias: `export type Role = z.infer<typeof Role>;` right after `export type User = z.infer<typeof User>;`.

- [ ] **Step 3: Update `data/seed/users.json`**

Add `"role": "admin"` to `u_anna` and `"role": "viewer"` to the other four. Full file:

```json
[
  { "id": "u_anna", "name": "Anna Lindqvist", "email": "anna@studio.co", "avatar": "AL", "role": "admin" },
  { "id": "u_mikael", "name": "Mikael Eriksson", "email": "mikael@studio.co", "avatar": "ME", "role": "viewer" },
  { "id": "u_sara", "name": "Sara Nielsen", "email": "sara@studio.co", "avatar": "SN", "role": "viewer" },
  { "id": "u_jonas", "name": "Jonas Berg", "email": "jonas@studio.co", "avatar": "JB", "role": "viewer" },
  { "id": "u_lena", "name": "Lena Kowalski", "email": "lena@studio.co", "avatar": "LK", "role": "viewer" }
]
```

- [ ] **Step 4: Make `/api/me` return admin**

The demo user needs to be admin so the Studio is reachable. Open `app/api/me/route.ts`:

```ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    id: "u_anna", name: "Anna Lindqvist", email: "anna@studio.co", avatar: "AL", role: "admin",
  });
}
```

- [ ] **Step 5: Run existing tests**

```bash
pnpm test
```

Expected: 20/20 still passing (seed schema roundtrip test will now verify the `role` field).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml lib/schemas/core.ts data/seed/users.json app/api/me/route.ts
git commit -m "feat(auth): add role field; install @anthropic-ai/sdk + nanoid"
```

### Task 2: Widget Zod schemas (discriminated union)

**Files:**
- Create: `lib/schemas/widgets.ts`
- Create: `lib/schemas/widgets.test.ts`

- [ ] **Step 1: Write the schemas**

Create `lib/schemas/widgets.ts`:

```ts
import { z } from "zod";

export const WidgetState = z.enum(["draft", "pending_review", "published", "archived"]);
export type WidgetState = z.infer<typeof WidgetState>;

export const DataSourceKey = z.enum(["opportunities", "contacts", "activities"]);
export type DataSourceKey = z.infer<typeof DataSourceKey>;

export const Agg = z.enum(["sum", "avg", "count", "min", "max"]);
export type Agg = z.infer<typeof Agg>;

export const Bucket = z.enum([
  "day", "week", "month",
  "stage", "salesperson", "tag", "priority", "type", "isCompany", "country",
]);
export type Bucket = z.infer<typeof Bucket>;

export const Filter = z.object({
  stage: z.union([z.string(), z.array(z.string())]).optional(),
  salespersonId: z.union([z.string(), z.array(z.string())]).optional(),
  priority: z.union([z.number(), z.array(z.number())]).optional(),
  done: z.boolean().optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  createdAfter: z.string().optional(),   // ISO or "now-6mo" / "now-30d"
  createdBefore: z.string().optional(),
  isCompany: z.boolean().optional(),
});
export type Filter = z.infer<typeof Filter>;

const Metric = z.discriminatedUnion("agg", [
  z.object({ agg: z.literal("count") }),
  z.object({ agg: z.enum(["sum", "avg", "min", "max"]), field: z.string() }),
]);

const CommonBase = {
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  state: WidgetState,
  createdBy: z.string(),
  createdAt: z.string(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  prompt: z.string().optional(),
};

export const StatTile = z.object({
  ...CommonBase,
  type: z.literal("stat_tile"),
  dataSource: DataSourceKey,
  metric: Metric,
  filter: Filter.optional(),
  compareTo: z.enum(["previous_period"]).nullish(),
});

export const BarChart = z.object({
  ...CommonBase,
  type: z.literal("bar_chart"),
  dataSource: DataSourceKey,
  groupBy: Bucket,
  metric: Metric,
  filter: Filter.optional(),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
});

export const LineChart = z.object({
  ...CommonBase,
  type: z.literal("line_chart"),
  dataSource: DataSourceKey,
  timeField: z.enum(["createdAt", "scheduledAt", "expectedClose"]),
  bucket: z.enum(["day", "week", "month"]),
  metric: Metric,
  filter: Filter.optional(),
});

export const PieChart = z.object({
  ...CommonBase,
  type: z.literal("pie_chart"),
  dataSource: DataSourceKey,
  groupBy: Bucket,
  metric: Metric,
  filter: Filter.optional(),
});

export const RecordTable = z.object({
  ...CommonBase,
  type: z.literal("record_table"),
  dataSource: DataSourceKey,
  columns: z.array(z.string()).min(1),
  filter: Filter.optional(),
  sortBy: z.object({ field: z.string(), dir: z.enum(["asc", "desc"]) }).optional(),
  limit: z.number().int().positive().max(50).default(10),
});

export const ActivityFeed = z.object({
  ...CommonBase,
  type: z.literal("activity_feed"),
  filter: Filter,
  groupBy: z.enum(["day", "assignee"]).nullish(),
  limit: z.number().int().positive().max(50).default(10),
});

export const WidgetSpec = z.discriminatedUnion("type", [
  StatTile, BarChart, LineChart, PieChart, RecordTable, ActivityFeed,
]);
export type WidgetSpec = z.infer<typeof WidgetSpec>;

// Variant without server-only fields — what the LLM emits
export const GeneratedWidget = z.discriminatedUnion("type", [
  StatTile.omit({ id: true, state: true, createdBy: true, createdAt: true, approvedBy: true, approvedAt: true, prompt: true }),
  BarChart.omit({ id: true, state: true, createdBy: true, createdAt: true, approvedBy: true, approvedAt: true, prompt: true }),
  LineChart.omit({ id: true, state: true, createdBy: true, createdAt: true, approvedBy: true, approvedAt: true, prompt: true }),
  PieChart.omit({ id: true, state: true, createdBy: true, createdAt: true, approvedBy: true, approvedAt: true, prompt: true }),
  RecordTable.omit({ id: true, state: true, createdBy: true, createdAt: true, approvedBy: true, approvedAt: true, prompt: true }),
  ActivityFeed.omit({ id: true, state: true, createdBy: true, createdAt: true, approvedBy: true, approvedAt: true, prompt: true }),
]);
export type GeneratedWidget = z.infer<typeof GeneratedWidget>;

export const WidgetTransition = z.object({
  next: z.enum(["draft", "pending_review", "published", "archived"]),
});
```

- [ ] **Step 2: Write the tests**

Create `lib/schemas/widgets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { WidgetSpec, GeneratedWidget } from "./widgets";

const baseCommon = {
  id: "w_1", title: "Test", state: "draft" as const,
  createdBy: "u_anna", createdAt: "2026-04-21T00:00:00Z",
};

describe("WidgetSpec", () => {
  it("parses a valid stat_tile", () => {
    const w = { ...baseCommon, type: "stat_tile", dataSource: "opportunities", metric: { agg: "count" } };
    expect(() => WidgetSpec.parse(w)).not.toThrow();
  });

  it("parses a valid bar_chart with count metric", () => {
    const w = { ...baseCommon, type: "bar_chart", dataSource: "opportunities", groupBy: "stage", metric: { agg: "count" } };
    expect(() => WidgetSpec.parse(w)).not.toThrow();
  });

  it("parses a valid line_chart with sum metric", () => {
    const w = {
      ...baseCommon, type: "line_chart", dataSource: "opportunities",
      timeField: "createdAt", bucket: "month",
      metric: { agg: "sum", field: "expectedRevenue" },
    };
    expect(() => WidgetSpec.parse(w)).not.toThrow();
  });

  it("parses a valid record_table", () => {
    const w = { ...baseCommon, type: "record_table", dataSource: "contacts", columns: ["name", "email"] };
    expect(() => WidgetSpec.parse(w)).not.toThrow();
  });

  it("parses a valid activity_feed", () => {
    const w = { ...baseCommon, type: "activity_feed", filter: { done: false } };
    expect(() => WidgetSpec.parse(w)).not.toThrow();
  });

  it("rejects a stat_tile with agg:sum but no field", () => {
    const w = { ...baseCommon, type: "stat_tile", dataSource: "opportunities", metric: { agg: "sum" } };
    expect(() => WidgetSpec.parse(w)).toThrow();
  });

  it("rejects record_table with empty columns", () => {
    const w = { ...baseCommon, type: "record_table", dataSource: "contacts", columns: [] };
    expect(() => WidgetSpec.parse(w)).toThrow();
  });

  it("GeneratedWidget omits server-only fields", () => {
    const gw = { type: "stat_tile", title: "T", dataSource: "opportunities", metric: { agg: "count" } };
    expect(() => GeneratedWidget.parse(gw)).not.toThrow();
  });
});
```

- [ ] **Step 3: Run tests — expect pass**

```bash
pnpm test
```

Expected: 28/28 (20 existing + 8 new).

- [ ] **Step 4: Commit**

```bash
git add lib/schemas/widgets.ts lib/schemas/widgets.test.ts
git commit -m "feat(widgets): Zod schemas for 6 widget variants"
```

### Task 3: Extend DataSource + MockDataSource with widgets

**Files:**
- Modify: `lib/data-source/types.ts`
- Modify: `lib/data-source/mock.ts`
- Modify: `lib/data-source/odoo.ts`
- Create: `lib/data-source/mock.widgets.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/data-source/mock.widgets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { makeMockDataSource } from "./mock";
import type { WidgetSpec } from "@/lib/schemas/widgets";

const draftSpec: Omit<WidgetSpec, "id" | "state" | "createdAt"> & { state?: never } = {
  type: "stat_tile", title: "Pipeline count",
  dataSource: "opportunities", metric: { agg: "count" },
  createdBy: "u_anna",
} as any;

describe("MockDataSource.widgets", () => {
  it("create + list returns the new widget", async () => {
    const ds = makeMockDataSource();
    const created = await ds.widgets.create(draftSpec as any);
    expect(created.id).toMatch(/^w_/);
    expect(created.state).toBe("draft");
    expect(created.createdAt).toBeTruthy();
    const all = await ds.widgets.list({});
    expect(all.find(w => w.id === created.id)).toBeTruthy();
  });

  it("transition admin→approved→published", async () => {
    const ds = makeMockDataSource();
    const w = await ds.widgets.create(draftSpec as any);
    const pending = await ds.widgets.transition(w.id, "pending_review", { by: "u_anna", isAdmin: true });
    expect(pending?.state).toBe("pending_review");
    const pub = await ds.widgets.transition(w.id, "published", { by: "u_anna", isAdmin: true });
    expect(pub?.state).toBe("published");
    expect(pub?.approvedBy).toBe("u_anna");
  });

  it("rejects publish by non-admin", async () => {
    const ds = makeMockDataSource();
    const w = await ds.widgets.create(draftSpec as any);
    await ds.widgets.transition(w.id, "pending_review", { by: "u_mikael", isAdmin: false });
    await expect(
      ds.widgets.transition(w.id, "published", { by: "u_mikael", isAdmin: false })
    ).rejects.toThrow(/admin/i);
  });

  it("list filters by state", async () => {
    const ds = makeMockDataSource();
    const w = await ds.widgets.create(draftSpec as any);
    await ds.widgets.transition(w.id, "pending_review", { by: "u_anna", isAdmin: true });
    const drafts = await ds.widgets.list({ state: "draft" });
    const pending = await ds.widgets.list({ state: "pending_review" });
    expect(drafts.find(d => d.id === w.id)).toBeFalsy();
    expect(pending.find(p => p.id === w.id)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
pnpm test
```

Expected: fails — `ds.widgets` doesn't exist.

- [ ] **Step 3: Extend the `DataSource` interface**

Open `lib/data-source/types.ts`. Append widget types and interface section:

```ts
import type { WidgetSpec, WidgetState } from "@/lib/schemas/widgets";

export type ListWidgetsParams = { state?: WidgetState; createdBy?: string };

export type TransitionContext = { by: string; isAdmin: boolean };
```

Add inside the `DataSource` interface (after `dashboard: …`):

```ts
  widgets: {
    list(p: ListWidgetsParams): Promise<WidgetSpec[]>;
    get(id: string): Promise<WidgetSpec | null>;
    create(data: Omit<WidgetSpec, "id" | "state" | "createdAt" | "approvedBy" | "approvedAt">): Promise<WidgetSpec>;
    update(id: string, patch: Partial<Omit<WidgetSpec, "id" | "createdAt" | "createdBy">>): Promise<WidgetSpec | null>;
    remove(id: string): Promise<boolean>;
    transition(id: string, next: WidgetState, ctx: TransitionContext): Promise<WidgetSpec | null>;
  };
```

- [ ] **Step 4: Implement in `MockDataSource`**

Open `lib/data-source/mock.ts`. Add imports at top:

```ts
import { nanoid } from "nanoid";
import type { WidgetSpec } from "@/lib/schemas/widgets";
import type { ListWidgetsParams, TransitionContext } from "./types";
```

Inside `makeMockDataSource`, alongside the existing arrays:

```ts
  const widgets: WidgetSpec[] = [];
```

Before the final `return {` block, add a helper:

```ts
  const widgetId = () => `w_${nanoid(10)}`;
```

Then add the `widgets` section in the returned object (next to `dashboard`):

```ts
    widgets: {
      async list(p: ListWidgetsParams) {
        return widgets.filter(w => {
          if (p.state && w.state !== p.state) return false;
          if (p.createdBy && w.createdBy !== p.createdBy) return false;
          return true;
        });
      },
      async get(id) { return widgets.find(w => w.id === id) ?? null; },
      async create(data) {
        const w = { ...data, id: widgetId(), state: "draft", createdAt: new Date().toISOString() } as WidgetSpec;
        widgets.push(w);
        return w;
      },
      async update(id, patch) {
        const i = widgets.findIndex(w => w.id === id);
        if (i === -1) return null;
        widgets[i] = { ...widgets[i], ...patch } as WidgetSpec;
        return widgets[i];
      },
      async remove(id) {
        const i = widgets.findIndex(w => w.id === id);
        if (i === -1) return false;
        widgets.splice(i, 1);
        return true;
      },
      async transition(id, next, ctx: TransitionContext) {
        const i = widgets.findIndex(w => w.id === id);
        if (i === -1) return null;
        if ((next === "approved" as any || next === "published") && !ctx.isAdmin) {
          throw new Error("admin role required to publish");
        }
        const patch: Partial<WidgetSpec> = { state: next };
        if (next === "published") {
          patch.approvedBy = ctx.by;
          patch.approvedAt = new Date().toISOString();
        }
        widgets[i] = { ...widgets[i], ...patch } as WidgetSpec;
        return widgets[i];
      },
    },
```

- [ ] **Step 5: Add stubs to `OdooDataSource`**

Open `lib/data-source/odoo.ts`. Add inside the returned object:

```ts
    widgets: {
      list: () => notImpl("widgets.list"),
      get: () => notImpl("widgets.get"),
      create: () => notImpl("widgets.create"),
      update: () => notImpl("widgets.update"),
      remove: () => notImpl("widgets.remove"),
      transition: () => notImpl("widgets.transition"),
    },
```

- [ ] **Step 6: Run tests — expect pass**

```bash
pnpm test
```

Expected: 32/32 (28 + 4 new).

- [ ] **Step 7: Commit**

```bash
git add lib/data-source/ lib/schemas/widgets.ts
git commit -m "feat(data): widgets collection on DataSource with admin-gated transitions"
```

---

## Phase 2 — API + LLM

### Task 4: Auth role helper

**Files:**
- Create: `lib/auth/role.ts`

- [ ] **Step 1: Write the helper**

```ts
import { NextResponse } from "next/server";

// Prototype-only stub: the demo user is always u_anna (admin). A real app
// would resolve the current user from the session cookie.
export function getCurrentUser() {
  return { id: "u_anna", role: "admin" as const };
}

export function requireAdmin() {
  const u = getCurrentUser();
  if (u.role !== "admin") {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin role required" } }, { status: 403 });
  }
  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth/role.ts
git commit -m "feat(auth): requireAdmin helper for admin-only routes"
```

### Task 5: Widget CRUD API routes

**Files:**
- Create: `app/api/widgets/route.ts`
- Create: `app/api/widgets/[id]/route.ts`

- [ ] **Step 1: `app/api/widgets/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDataSource } from "@/lib/data-source";
import { WidgetState, WidgetSpec } from "@/lib/schemas/widgets";
import { getCurrentUser } from "@/lib/auth/role";

const ListQuery = z.object({
  state: WidgetState.optional(),
  createdBy: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = ListQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  return NextResponse.json(await getDataSource().widgets.list(parsed.data));
}

const CreateBody = WidgetSpec.omit({
  id: true, state: true, createdAt: true, approvedBy: true, approvedAt: true,
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const me = getCurrentUser();
  const withCreatedBy = { ...body, createdBy: me.id };
  const parsed = CreateBody.safeParse(withCreatedBy);
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const created = await getDataSource().widgets.create(parsed.data as any);
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: `app/api/widgets/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { WidgetSpec } from "@/lib/schemas/widgets";

const PatchBody = WidgetSpec.partial().omit({ id: true, createdAt: true, createdBy: true });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getDataSource().widgets.get(id);
  if (!row) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  const updated = await getDataSource().widgets.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await getDataSource().widgets.remove(id);
  if (!ok) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: new routes listed.

- [ ] **Step 4: Commit**

```bash
git add app/api/widgets/route.ts app/api/widgets/[id]/route.ts
git commit -m "feat(api): widgets CRUD routes"
```

### Task 6: Transition route (admin-gated)

**Files:**
- Create: `app/api/widgets/[id]/transition/route.ts`

- [ ] **Step 1: Write the handler**

```ts
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { WidgetTransition } from "@/lib/schemas/widgets";
import { getCurrentUser, requireAdmin } from "@/lib/auth/role";

const ADMIN_ONLY: ReadonlyArray<string> = ["published", "approved"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = WidgetTransition.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });

  if (ADMIN_ONLY.includes(parsed.data.next)) {
    const forbidden = requireAdmin();
    if (forbidden) return forbidden;
  }

  const me = getCurrentUser();
  try {
    const updated = await getDataSource().widgets.transition(
      id, parsed.data.next, { by: me.id, isAdmin: me.role === "admin" }
    );
    if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: (e as Error).message } }, { status: 403 });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add app/api/widgets/[id]/transition/route.ts
git commit -m "feat(api): widget state transition route with admin gating"
```

### Task 7: `/api/widgets/generate` — Claude tool-use

**Files:**
- Create: `lib/widgets/prompt.ts`
- Create: `app/api/widgets/generate/route.ts`
- Create: `app/api/widgets/generate/route.test.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add env var**

Append to `.env.example`:

```
ANTHROPIC_API_KEY=your-key-here
```

- [ ] **Step 2: Write the system prompt module**

Create `lib/widgets/prompt.ts`:

```ts
export const WIDGET_SYSTEM_PROMPT = `You convert a user's natural-language request into a JSON widget spec for a CRM dashboard.

Available data sources and their fields:
- opportunities (crm deals): id, name, partnerId, salespersonId, stageId, expectedRevenue, probability, currency (EUR|USD|DKK), tags[], priority (0-3), createdAt, expectedClose, description
- contacts (companies + individuals): id, name, isCompany, parentId, email, phone, title, city, country, tags[]
- activities (tasks): id, opportunityId, type (call|meeting|email|todo), summary, scheduledAt, done, assignedTo

Available stages: s_new, s_qualified, s_proposition, s_won, s_lost
Available salesperson ids: u_anna, u_mikael, u_sara, u_jonas, u_lena

Widget types:
- stat_tile: a single big number
- bar_chart: counts/sums grouped by a dimension
- line_chart: metric over time (day/week/month buckets)
- pie_chart: share of total across categories
- record_table: top-N rows with chosen columns
- activity_feed: filtered list of activities

Rules:
- Choose the widget type that fits the request best.
- Use concise, descriptive titles (4-8 words, no "Dashboard showing …").
- For date filters, use "now-30d", "now-6mo", "now-1y" style relative values.
- Never invent field names. Only reference fields listed above.
- If the request is ambiguous, pick the most reasonable interpretation.

Emit your response by calling the emit_widget tool exactly once.`;
```

- [ ] **Step 3: Write the route handler**

Create `app/api/widgets/generate/route.ts`:

```ts
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { GeneratedWidget } from "@/lib/schemas/widgets";
import { WIDGET_SYSTEM_PROMPT } from "@/lib/widgets/prompt";
import { requireAdmin } from "@/lib/auth/role";

const Body = z.object({ prompt: z.string().min(3).max(500) });

const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const TOOL = {
  name: "emit_widget" as const,
  description: "Return the JSON widget spec.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: { type: "string", enum: ["stat_tile", "bar_chart", "line_chart", "pie_chart", "record_table", "activity_feed"] },
      title: { type: "string" },
    },
    required: ["type", "title"],
    additionalProperties: true,
  },
};

async function callClaude(prompt: string, retryHint?: string) {
  const msg = await client().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: WIDGET_SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "emit_widget" },
    messages: [{ role: "user", content: retryHint ? `${prompt}\n\nPrevious attempt failed: ${retryHint}. Try again, valid JSON only.` : prompt }],
  });
  const tool = msg.content.find(c => c.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("no tool_use block returned");
  return tool.input;
}

export async function POST(req: Request) {
  const forbidden = requireAdmin();
  if (forbidden) return forbidden;
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: { code: "NO_LLM_KEY", message: "ANTHROPIC_API_KEY not set" } }, { status: 500 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });

  try {
    const firstRaw = await callClaude(parsed.data.prompt);
    const first = GeneratedWidget.safeParse(firstRaw);
    if (first.success) return NextResponse.json({ spec: first.data, prompt: parsed.data.prompt });

    const secondRaw = await callClaude(parsed.data.prompt, first.error.message);
    const second = GeneratedWidget.safeParse(secondRaw);
    if (second.success) return NextResponse.json({ spec: second.data, prompt: parsed.data.prompt });

    return NextResponse.json({ error: { code: "BAD_SPEC", message: second.error.message } }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: { code: "LLM_ERROR", message: (e as Error).message } }, { status: 502 });
  }
}
```

- [ ] **Step 4: Write the tests (mock Anthropic SDK)**

Create `app/api/widgets/generate/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const createMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: (...args: any[]) => createMock(...args) },
  })),
}));

vi.mock("@/lib/auth/role", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/role")>("@/lib/auth/role");
  return { ...actual, requireAdmin: () => null };
});

process.env.ANTHROPIC_API_KEY = "test-key";

function req(body: unknown) {
  return new Request("http://localhost/api/widgets/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validStatTile = {
  type: "stat_tile", title: "Total deals", dataSource: "opportunities", metric: { agg: "count" },
};

function mockReply(input: unknown) {
  return { content: [{ type: "tool_use", name: "emit_widget", input }] };
}

describe("POST /api/widgets/generate", () => {
  beforeEach(() => createMock.mockReset());

  it("returns spec on first valid LLM reply", async () => {
    createMock.mockResolvedValueOnce(mockReply(validStatTile));
    const res = await POST(req({ prompt: "count my deals" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.spec.type).toBe("stat_tile");
  });

  it("retries once on invalid spec", async () => {
    createMock.mockResolvedValueOnce(mockReply({ type: "stat_tile" }));  // invalid
    createMock.mockResolvedValueOnce(mockReply(validStatTile));
    const res = await POST(req({ prompt: "count deals" }));
    expect(res.status).toBe(200);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("returns BAD_SPEC after two invalid specs", async () => {
    createMock.mockResolvedValueOnce(mockReply({ type: "stat_tile" }));
    createMock.mockResolvedValueOnce(mockReply({ type: "stat_tile" }));
    const res = await POST(req({ prompt: "bad" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("BAD_SPEC");
  });

  it("returns 400 on empty prompt", async () => {
    const res = await POST(req({ prompt: "" }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 5: Run tests — expect pass**

```bash
pnpm test
```

Expected: 36/36 (32 + 4 new).

- [ ] **Step 6: Commit**

```bash
git add app/api/widgets/generate lib/widgets/prompt.ts .env.example
git commit -m "feat(api): widgets/generate with Claude tool-use + retry"
```

### Task 8: TanStack Query hooks for widgets

**Files:**
- Create: `lib/api-client/widgets.ts`

- [ ] **Step 1: Write the hooks**

```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WidgetSpec, WidgetState, GeneratedWidget } from "@/lib/schemas/widgets";
import { api } from "./fetch";

export function useWidgets(params: { state?: WidgetState } = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
  ).toString();
  return useQuery<WidgetSpec[]>({
    queryKey: ["widgets", params],
    queryFn: () => api<WidgetSpec[]>(`/api/widgets${qs ? `?${qs}` : ""}`),
  });
}

export function useWidget(id: string) {
  return useQuery<WidgetSpec>({
    queryKey: ["widget", id],
    queryFn: () => api<WidgetSpec>(`/api/widgets/${id}`),
    enabled: !!id,
  });
}

export function useGenerateWidget() {
  return useMutation<{ spec: GeneratedWidget; prompt: string }, Error, string>({
    mutationFn: (prompt: string) =>
      api(`/api/widgets/generate`, { method: "POST", body: JSON.stringify({ prompt }) }),
  });
}

export function useCreateWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (spec: unknown) =>
      api<WidgetSpec>(`/api/widgets`, { method: "POST", body: JSON.stringify(spec) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["widgets"] }),
  });
}

export function useUpdateWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<WidgetSpec> }) =>
      api<WidgetSpec>(`/api/widgets/${args.id}`, { method: "PATCH", body: JSON.stringify(args.patch) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["widgets"] });
      qc.invalidateQueries({ queryKey: ["widget", v.id] });
    },
  });
}

export function useTransitionWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; next: WidgetState }) =>
      api<WidgetSpec>(`/api/widgets/${args.id}/transition`, { method: "PATCH", body: JSON.stringify({ next: args.next }) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["widgets"] });
      qc.invalidateQueries({ queryKey: ["widget", v.id] });
    },
  });
}

export function useDeleteWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<null>(`/api/widgets/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["widgets"] }),
  });
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add lib/api-client/widgets.ts
git commit -m "feat(api-client): widget query + mutation hooks"
```

---

## Phase 3 — Renderer + aggregation

### Task 9: `aggregate()` pure function with tests

**Files:**
- Create: `lib/widgets/aggregate.ts`
- Create: `lib/widgets/aggregate.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/widgets/aggregate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { applyFilter, resolveTimeToken, aggregate, groupRows } from "./aggregate";
import type { Opportunity, Activity, Contact } from "@/lib/schemas/core";

const baseOpp = {
  id: "o1", name: "Acme — Web", partnerId: "c1", salespersonId: "u_anna",
  stageId: "s_qualified", expectedRevenue: 10_000, probability: 40, currency: "EUR" as const,
  tags: ["enterprise"], priority: 2 as const, createdAt: "2026-03-01T00:00:00Z",
  expectedClose: "2026-05-01", description: "",
};

const opps: Opportunity[] = [
  { ...baseOpp },
  { ...baseOpp, id: "o2", stageId: "s_won", expectedRevenue: 30_000 },
  { ...baseOpp, id: "o3", stageId: "s_won", expectedRevenue: 50_000, salespersonId: "u_sara" },
  { ...baseOpp, id: "o4", stageId: "s_new", expectedRevenue: 5_000 },
];

describe("resolveTimeToken", () => {
  it("parses now-30d", () => {
    const now = new Date("2026-04-21T00:00:00Z");
    const resolved = resolveTimeToken("now-30d", now);
    expect(resolved).toBe("2026-03-22T00:00:00.000Z");
  });
  it("returns ISO unchanged", () => {
    expect(resolveTimeToken("2026-01-01", new Date())).toBe("2026-01-01");
  });
});

describe("applyFilter", () => {
  it("filters by single stage", () => {
    const out = applyFilter(opps, { stage: "s_won" }, "opportunities");
    expect(out).toHaveLength(2);
  });
  it("filters by stage array", () => {
    const out = applyFilter(opps, { stage: ["s_won", "s_new"] }, "opportunities");
    expect(out).toHaveLength(3);
  });
  it("filters by createdAfter token", () => {
    const out = applyFilter(opps, { createdAfter: "now-10y" }, "opportunities");
    expect(out).toHaveLength(4);
  });
});

describe("aggregate — stat_tile", () => {
  it("count", () => {
    const v = aggregate({ type: "stat_tile", title: "", dataSource: "opportunities", metric: { agg: "count" } } as any, opps);
    expect(v).toBe(4);
  });
  it("sum", () => {
    const v = aggregate({ type: "stat_tile", title: "", dataSource: "opportunities", metric: { agg: "sum", field: "expectedRevenue" } } as any, opps);
    expect(v).toBe(95_000);
  });
  it("avg", () => {
    const v = aggregate({ type: "stat_tile", title: "", dataSource: "opportunities", metric: { agg: "avg", field: "expectedRevenue" } } as any, opps);
    expect(v).toBe(23_750);
  });
});

describe("groupRows", () => {
  it("groups opportunities by stage and counts", () => {
    const out = groupRows(opps, "stage", { agg: "count" }, "opportunities");
    expect(out).toEqual(expect.arrayContaining([
      { key: "s_won", value: 2 },
      { key: "s_qualified", value: 1 },
      { key: "s_new", value: 1 },
    ]));
  });
  it("groups by salesperson and sums revenue", () => {
    const out = groupRows(opps, "salesperson", { agg: "sum", field: "expectedRevenue" }, "opportunities");
    expect(out.find(r => r.key === "u_anna")?.value).toBe(45_000);
    expect(out.find(r => r.key === "u_sara")?.value).toBe(50_000);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
pnpm test
```

- [ ] **Step 3: Implement `lib/widgets/aggregate.ts`**

```ts
import type { Opportunity, Contact, Activity } from "@/lib/schemas/core";
import type { WidgetSpec, Filter, DataSourceKey, Bucket, Agg } from "@/lib/schemas/widgets";

type Metric = { agg: "count" } | { agg: Exclude<Agg, "count">; field: string };
type Row = Opportunity | Contact | Activity;

const TIME_TOKEN = /^now-(\d+)(d|w|mo|y)$/;

export function resolveTimeToken(tok: string, now: Date = new Date()): string {
  const m = tok.match(TIME_TOKEN);
  if (!m) return tok;
  const n = Number(m[1]);
  const unit = m[2];
  const ms = unit === "d" ? n * 86400_000
    : unit === "w" ? n * 7 * 86400_000
    : unit === "mo" ? n * 30 * 86400_000
    : unit === "y" ? n * 365 * 86400_000
    : 0;
  return new Date(now.getTime() - ms).toISOString();
}

function matchEq<T>(value: T, filterValue: T | T[] | undefined): boolean {
  if (filterValue === undefined) return true;
  if (Array.isArray(filterValue)) return (filterValue as T[]).includes(value);
  return value === filterValue;
}

export function applyFilter<R extends Row>(rows: R[], f: Filter | undefined, ds: DataSourceKey): R[] {
  if (!f) return rows;
  const after = f.createdAfter ? resolveTimeToken(f.createdAfter) : undefined;
  const before = f.createdBefore ? resolveTimeToken(f.createdBefore) : undefined;
  return rows.filter(r => {
    const rec = r as any;
    if (ds === "opportunities") {
      if (!matchEq(rec.stageId, f.stage)) return false;
      if (!matchEq(rec.salespersonId, f.salespersonId)) return false;
      if (!matchEq(rec.priority, f.priority)) return false;
      if (f.tag !== undefined) {
        const tags: string[] = rec.tags ?? [];
        const wanted = Array.isArray(f.tag) ? f.tag : [f.tag];
        if (!wanted.some(t => tags.includes(t))) return false;
      }
    }
    if (ds === "activities") {
      if (!matchEq(rec.type, f.type)) return false;
      if (f.done !== undefined && rec.done !== f.done) return false;
      if (!matchEq(rec.assignedTo, f.salespersonId)) return false;
    }
    if (ds === "contacts") {
      if (f.isCompany !== undefined && rec.isCompany !== f.isCompany) return false;
    }
    const timeField = ds === "activities" ? rec.scheduledAt : rec.createdAt;
    if (after && timeField && timeField < after) return false;
    if (before && timeField && timeField > before) return false;
    return true;
  });
}

function applyMetric<R extends Row>(rows: R[], metric: Metric): number {
  if (metric.agg === "count") return rows.length;
  const vals = rows.map(r => Number((r as any)[metric.field] ?? 0));
  if (vals.length === 0) return 0;
  switch (metric.agg) {
    case "sum": return vals.reduce((a, b) => a + b, 0);
    case "avg": return vals.reduce((a, b) => a + b, 0) / vals.length;
    case "min": return Math.min(...vals);
    case "max": return Math.max(...vals);
  }
}

export function aggregate(spec: WidgetSpec, rows: Row[]): number {
  if (spec.type !== "stat_tile") throw new Error("aggregate() only for stat_tile");
  const filtered = applyFilter(rows, spec.filter, spec.dataSource);
  return applyMetric(filtered, spec.metric as Metric);
}

function bucketKey(row: any, bucket: Bucket, ds: DataSourceKey): string {
  if (bucket === "stage") return row.stageId ?? "—";
  if (bucket === "salesperson") return row.salespersonId ?? row.assignedTo ?? "—";
  if (bucket === "priority") return String(row.priority ?? "—");
  if (bucket === "type") return row.type ?? "—";
  if (bucket === "tag") return (row.tags ?? [])[0] ?? "—";
  if (bucket === "isCompany") return String(row.isCompany);
  if (bucket === "country") return row.country ?? "—";
  const time = ds === "activities" ? row.scheduledAt : row.createdAt;
  if (!time) return "—";
  const d = new Date(time);
  if (bucket === "day") return d.toISOString().slice(0, 10);
  if (bucket === "week") {
    const y = d.getUTCFullYear();
    const start = Date.UTC(y, 0, 1);
    const w = Math.floor((d.getTime() - start) / (7 * 864e5));
    return `${y}-W${String(w + 1).padStart(2, "0")}`;
  }
  if (bucket === "month") return d.toISOString().slice(0, 7);
  return "—";
}

export function groupRows<R extends Row>(rows: R[], bucket: Bucket, metric: Metric, ds: DataSourceKey) {
  const buckets = new Map<string, R[]>();
  for (const r of rows) {
    const k = bucketKey(r, bucket, ds);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(r);
  }
  const out: { key: string; value: number }[] = [];
  for (const [k, rs] of buckets) out.push({ key: k, value: applyMetric(rs, metric) });
  return out;
}
```

- [ ] **Step 4: Run — expect pass**

```bash
pnpm test
```

Expected: 45/45 (36 + 9 new).

- [ ] **Step 5: Commit**

```bash
git add lib/widgets/aggregate.ts lib/widgets/aggregate.test.ts
git commit -m "feat(widgets): pure aggregate() with filter + grouping + metrics"
```

### Task 10: `<WidgetRenderer>`

**Files:**
- Create: `lib/widgets/renderer.tsx`

- [ ] **Step 1: Write the renderer**

```tsx
"use client";
import { useMemo } from "react";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useContacts } from "@/lib/api-client/contacts";
import { useActivities } from "@/lib/api-client/activities";
import { aggregate, applyFilter, groupRows } from "./aggregate";
import type { WidgetSpec, DataSourceKey } from "@/lib/schemas/widgets";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, parseISO } from "date-fns";

const COLORS = ["var(--accent)", "var(--accent-2)", "var(--accent-3)", "var(--warning)", "var(--danger)", "var(--success)"];

function useRows(ds: DataSourceKey) {
  const opps = useOpportunities().data ?? [];
  const contacts = useContacts().data ?? [];
  const acts = useActivities().data ?? [];
  if (ds === "opportunities") return opps;
  if (ds === "contacts") return contacts;
  return acts;
}

const fmt = (n: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(n);

export function WidgetRenderer({ spec }: { spec: WidgetSpec }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="text-sm font-medium mb-2">{spec.title}</div>
      {spec.description && <div className="text-xs text-text-muted mb-3">{spec.description}</div>}
      <WidgetBody spec={spec} />
    </div>
  );
}

function WidgetBody({ spec }: { spec: WidgetSpec }) {
  if (spec.type === "stat_tile") return <StatTileBody spec={spec} />;
  if (spec.type === "bar_chart") return <BarBody spec={spec} />;
  if (spec.type === "line_chart") return <LineBody spec={spec} />;
  if (spec.type === "pie_chart") return <PieBody spec={spec} />;
  if (spec.type === "record_table") return <TableBody spec={spec} />;
  if (spec.type === "activity_feed") return <ActivityBody spec={spec} />;
  return null;
}

function StatTileBody({ spec }: { spec: Extract<WidgetSpec, { type: "stat_tile" }> }) {
  const rows = useRows(spec.dataSource);
  const value = useMemo(() => aggregate(spec, rows), [spec, rows]);
  return <div className="text-3xl font-semibold">{fmt(value)}</div>;
}

function BarBody({ spec }: { spec: Extract<WidgetSpec, { type: "bar_chart" }> }) {
  const rows = useRows(spec.dataSource);
  const data = useMemo(
    () => groupRows(applyFilter(rows as any, spec.filter, spec.dataSource), spec.groupBy, spec.metric as any, spec.dataSource).map(d => ({ name: d.key, value: d.value })),
    [spec, rows]
  );
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LineBody({ spec }: { spec: Extract<WidgetSpec, { type: "line_chart" }> }) {
  const rows = useRows(spec.dataSource);
  const data = useMemo(() => {
    const filtered = applyFilter(rows as any, spec.filter, spec.dataSource);
    // rebuild rows using timeField for bucketing
    const shifted = filtered.map((r: any) => ({ ...r, createdAt: r[spec.timeField] ?? r.createdAt }));
    return groupRows(shifted, spec.bucket, spec.metric as any, spec.dataSource)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(d => ({ name: d.key, value: d.value }));
  }, [spec, rows]);
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <Line type="monotone" dataKey="value" stroke="var(--accent-2)" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieBody({ spec }: { spec: Extract<WidgetSpec, { type: "pie_chart" }> }) {
  const rows = useRows(spec.dataSource);
  const data = useMemo(
    () => groupRows(applyFilter(rows as any, spec.filter, spec.dataSource), spec.groupBy, spec.metric as any, spec.dataSource).map(d => ({ name: d.key, value: d.value })),
    [spec, rows]
  );
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TableBody({ spec }: { spec: Extract<WidgetSpec, { type: "record_table" }> }) {
  const rows = useRows(spec.dataSource);
  const filtered = useMemo(() => applyFilter(rows as any, spec.filter, spec.dataSource), [spec, rows]);
  const sorted = useMemo(() => {
    if (!spec.sortBy) return filtered;
    const { field, dir } = spec.sortBy;
    return [...filtered].sort((a: any, b: any) => {
      const av = a[field], bv = b[field];
      if (av === bv) return 0;
      return (av < bv ? -1 : 1) * (dir === "asc" ? 1 : -1);
    });
  }, [filtered, spec.sortBy]);
  const limited = sorted.slice(0, spec.limit ?? 10);
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-text-muted"><tr>{spec.columns.map(c => <th key={c} className="text-left text-xs uppercase px-2 py-1">{c}</th>)}</tr></thead>
        <tbody>
          {limited.map((r: any) => (
            <tr key={r.id} className="border-t border-border">{spec.columns.map(c => <td key={c} className="px-2 py-1 truncate max-w-[200px]">{String(r[c] ?? "—")}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityBody({ spec }: { spec: Extract<WidgetSpec, { type: "activity_feed" }> }) {
  const rows = useRows("activities");
  const filtered = useMemo(() => applyFilter(rows as any, spec.filter, "activities"), [spec, rows]);
  const limited = filtered.slice(0, spec.limit ?? 10);
  return (
    <ul className="space-y-1 text-sm">
      {limited.map((a: any) => (
        <li key={a.id} className="flex items-center gap-2">
          <span className="text-text-muted text-xs">{format(parseISO(a.scheduledAt), "MMM d, HH:mm")}</span>
          <span className="truncate">{a.summary}</span>
        </li>
      ))}
      {limited.length === 0 && <li className="text-text-muted">No activities match.</li>}
    </ul>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add lib/widgets/renderer.tsx
git commit -m "feat(widgets): WidgetRenderer for all 6 variants"
```

---

## Phase 4 — UI

### Task 11: Example prompts module + Custom widgets grid

**Files:**
- Create: `lib/widgets/example-prompts.ts`
- Create: `components/widgets/custom-widgets-grid.tsx`
- Create: `components/widgets/example-gallery.tsx`

- [ ] **Step 1: `lib/widgets/example-prompts.ts`**

```ts
export const EXAMPLE_PROMPTS: { label: string; prompt: string }[] = [
  { label: "Deals won this quarter by salesperson", prompt: "Bar chart of deals won in the last 3 months, grouped by salesperson, counting deals." },
  { label: "Pipeline value by stage", prompt: "Bar chart of total expected revenue grouped by stage, excluding Won and Lost." },
  { label: "My overdue activities this week", prompt: "Activity feed of undone activities scheduled in the last 7 days." },
  { label: "Revenue forecast for the next 3 months", prompt: "Line chart of expectedRevenue by month, using expectedClose, filtered to the next 3 months." },
];
```

- [ ] **Step 2: `components/widgets/example-gallery.tsx`**

```tsx
"use client";
import { EXAMPLE_PROMPTS } from "@/lib/widgets/example-prompts";

export function ExampleGallery({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {EXAMPLE_PROMPTS.map(p => (
        <button
          key={p.label}
          type="button"
          onClick={() => onPick(p.prompt)}
          className="text-left text-sm bg-surface border border-border rounded-md px-3 py-2 hover:bg-surface-muted/40"
        >
          <span className="block font-medium">{p.label}</span>
          <span className="block text-xs text-text-muted mt-0.5 line-clamp-2">{p.prompt}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `components/widgets/custom-widgets-grid.tsx`**

```tsx
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useWidgets, useDeleteWidget, useTransitionWidget } from "@/lib/api-client/widgets";
import { WidgetRenderer } from "@/lib/widgets/renderer";
import { ExampleGallery } from "./example-gallery";
import { useRouter } from "next/navigation";

export function CustomWidgetsGrid() {
  const router = useRouter();
  const widgets = useWidgets({ state: "published" }).data ?? [];
  const del = useDeleteWidget();
  const transition = useTransitionWidget();

  if (widgets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-lg p-6 text-center space-y-3">
          <Sparkles className="h-6 w-6 text-accent mx-auto" />
          <div className="text-sm font-medium">No custom widgets yet</div>
          <div className="text-xs text-text-muted">Describe a chart and we'll generate it.</div>
          <Link href="/dashboard/studio"><Button size="sm">Open Widget Studio</Button></Link>
        </div>
        <div>
          <div className="text-xs uppercase text-text-muted mb-2">Try one of these</div>
          <ExampleGallery onPick={p => router.push(`/dashboard/studio?prompt=${encodeURIComponent(p)}`)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-text-muted">{widgets.length} published</div>
        <Link href="/dashboard/studio"><Button size="sm" variant="outline"><Sparkles className="h-4 w-4 mr-1" />New widget</Button></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.map(w => (
          <div key={w.id} className="relative group">
            <WidgetRenderer spec={w} />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
              <Link href={`/dashboard/studio?id=${w.id}`} className="text-xs bg-surface border border-border rounded px-2 py-1 hover:bg-surface-muted">Edit</Link>
              <button onClick={() => transition.mutate({ id: w.id, next: "archived" })} className="text-xs bg-surface border border-border rounded px-2 py-1 hover:bg-surface-muted">Archive</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/widgets/example-prompts.ts components/widgets/
git commit -m "feat(widgets): CustomWidgetsGrid + ExampleGallery"
```

### Task 12: Third tab on `/dashboard`

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Add the tab**

Open `app/(app)/dashboard/page.tsx`. Add import at top:

```tsx
import { CustomWidgetsGrid } from "@/components/widgets/custom-widgets-grid";
```

Find the `<TabsList>` and add a third trigger:

```tsx
<TabsTrigger value="custom">Custom widgets</TabsTrigger>
```

After the existing `<TabsContent value="tasks">...</TabsContent>` block, add:

```tsx
<TabsContent value="custom" className="mt-4">
  <CustomWidgetsGrid />
</TabsContent>
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add app/(app)/dashboard/page.tsx
git commit -m "feat(dashboard): third tab for custom widgets"
```

### Task 13: Widget Studio page

**Files:**
- Create: `app/(app)/dashboard/studio/page.tsx`
- Create: `components/widgets/studio-editor.tsx`

- [ ] **Step 1: `components/widgets/studio-editor.tsx`**

```tsx
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetSpec } from "@/lib/schemas/widgets";

export function StudioEditor({ spec, onChange }: { spec: Partial<WidgetSpec>; onChange: (patch: Partial<WidgetSpec>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Title</Label>
        <Input value={spec.title ?? ""} onChange={e => onChange({ title: e.target.value })} />
      </div>
      <div>
        <Label>Widget type</Label>
        <Select value={(spec.type as string) ?? ""} onValueChange={v => v && onChange({ type: v as any })}>
          <SelectTrigger><SelectValue placeholder="Pick a type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="stat_tile">Stat tile</SelectItem>
            <SelectItem value="bar_chart">Bar chart</SelectItem>
            <SelectItem value="line_chart">Line chart</SelectItem>
            <SelectItem value="pie_chart">Pie chart</SelectItem>
            <SelectItem value="record_table">Record table</SelectItem>
            <SelectItem value="activity_feed">Activity feed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Data source</Label>
        <Select value={(spec as any).dataSource ?? ""} onValueChange={v => v && onChange({ dataSource: v as any } as any)}>
          <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="opportunities">Opportunities</SelectItem>
            <SelectItem value="contacts">Contacts</SelectItem>
            <SelectItem value="activities">Activities</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Raw JSON</Label>
        <textarea
          className="w-full bg-surface-muted rounded-md p-2 text-xs font-mono min-h-[200px]"
          value={JSON.stringify(spec, null, 2)}
          onChange={e => {
            try { onChange(JSON.parse(e.target.value)); } catch { /* ignore invalid intermediate input */ }
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `app/(app)/dashboard/studio/page.tsx`**

```tsx
"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Sparkles, Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { WidgetSpec } from "@/lib/schemas/widgets";
import { useGenerateWidget, useCreateWidget, useUpdateWidget, useTransitionWidget, useWidget } from "@/lib/api-client/widgets";
import { WidgetRenderer } from "@/lib/widgets/renderer";
import { StudioEditor } from "@/components/widgets/studio-editor";
import { ExampleGallery } from "@/components/widgets/example-gallery";

export default function WidgetStudioPage() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const initialPrompt = params.get("prompt") ?? "";

  const existing = useWidget(id ?? "");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [spec, setSpec] = useState<Partial<WidgetSpec>>({});

  useEffect(() => { if (existing.data) setSpec(existing.data); }, [existing.data]);

  const gen = useGenerateWidget();
  const create = useCreateWidget();
  const update = useUpdateWidget();
  const transition = useTransitionWidget();

  const generate = async (p: string) => {
    try {
      const res = await gen.mutateAsync(p);
      setSpec({ ...res.spec, prompt: p });
      toast.success("Generated");
    } catch (e) { toast.error((e as Error).message); }
  };

  const save = async (nextState?: "draft" | "pending_review" | "published") => {
    try {
      if (id) {
        await update.mutateAsync({ id, patch: spec });
        if (nextState) await transition.mutateAsync({ id, next: nextState });
      } else {
        const created = await create.mutateAsync(spec);
        if (nextState) await transition.mutateAsync({ id: created.id, next: nextState });
        router.replace(`/dashboard/studio?id=${created.id}`);
      }
      toast.success(nextState ? `Moved to ${nextState}` : "Saved");
    } catch (e) { toast.error((e as Error).message); }
  };

  const copyReviewLink = () => {
    if (!id) return toast.error("Save first to get a review link");
    const url = `${window.location.origin}/dashboard/widget/${id}?ro=1`;
    navigator.clipboard.writeText(url);
    toast.success("Review link copied");
  };

  const canRender = spec.type && (spec as any).dataSource;

  return (
    <div className="p-6 h-full">
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Link href="/dashboard" className="hover:text-text">Dashboard</Link>
        <span>/</span><span>Custom widgets</span>
        <span>/</span><span className="text-text">Studio</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-3rem)]">
        {/* Left: prompt + editor */}
        <div className="space-y-4 overflow-auto pr-2">
          <div>
            <label className="text-sm font-medium mb-2 block">Describe your widget</label>
            <Textarea
              rows={3}
              value={prompt}
              onChange={(e: any) => setPrompt(e.target.value)}
              placeholder="e.g. Bar chart of won deals by salesperson last 6 months"
              className="w-full"
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={() => generate(prompt)} disabled={gen.isPending || prompt.length < 3}>
                <Sparkles className="h-4 w-4 mr-1" />{gen.isPending ? "Generating…" : "Generate"}
              </Button>
            </div>
          </div>

          {!spec.type && (
            <div>
              <div className="text-xs uppercase text-text-muted mb-2">Try one of these</div>
              <ExampleGallery onPick={(p) => { setPrompt(p); generate(p); }} />
            </div>
          )}

          {spec.type && <StudioEditor spec={spec} onChange={patch => setSpec(prev => ({ ...prev, ...patch }))} />}
        </div>

        {/* Right: preview */}
        <div className="space-y-3 overflow-auto pr-2">
          <div className="text-xs uppercase text-text-muted">Preview</div>
          {canRender
            ? <WidgetRenderer spec={spec as WidgetSpec} />
            : <div className="bg-surface border border-border rounded-lg p-6 text-sm text-text-muted text-center">Preview appears after you pick a type + data source.</div>}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => save()}>Save draft</Button>
            <Button variant="outline" size="sm" onClick={() => save("pending_review")}>Submit for review</Button>
            <Button size="sm" onClick={() => save("published")}>Approve & publish</Button>
            <Button variant="ghost" size="sm" onClick={copyReviewLink}><Copy className="h-4 w-4 mr-1" />Copy review link</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Ensure `Textarea` exists**

Check `components/ui/input.tsx` exports `Textarea`. If not, create `components/ui/textarea.tsx`:

```bash
pnpm dlx shadcn@latest add textarea --yes
```

Update the import in `app/(app)/dashboard/studio/page.tsx` accordingly (e.g. `import { Textarea } from "@/components/ui/textarea";`).

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add app/(app)/dashboard/studio components/widgets/studio-editor.tsx components/ui/textarea.tsx 2>/dev/null
git commit -m "feat(studio): Widget Studio page with prompt, preview, actions"
```

### Task 14: Share-review route + Playwright smoke test

**Files:**
- Create: `app/(app)/dashboard/widget/[id]/page.tsx`
- Create: `e2e/widget-builder.spec.ts`
- Modify: `README.md` (tiny section on widgets)

- [ ] **Step 1: `app/(app)/dashboard/widget/[id]/page.tsx`**

```tsx
"use client";
import { use } from "react";
import Link from "next/link";
import { useWidget } from "@/lib/api-client/widgets";
import { WidgetRenderer } from "@/lib/widgets/renderer";
import { Badge } from "@/components/ui/badge";

export default function WidgetReviewPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ro?: string }>;
}) {
  const { id } = use(params);
  const sp = use(searchParams);
  const { data: widget } = useWidget(id);
  if (!widget) return <div className="p-6 text-text-muted">Loading…</div>;
  return (
    <div className="p-6 space-y-3 max-w-[720px]">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/dashboard" className="hover:text-text">Dashboard</Link>
        <span>/</span><span className="text-text">Review</span>
      </div>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{widget.title}</h1>
        <Badge variant="outline">{widget.state}</Badge>
        {sp.ro && <Badge variant="secondary">read-only</Badge>}
      </div>
      <WidgetRenderer spec={widget} />
    </div>
  );
}
```

- [ ] **Step 2: `e2e/widget-builder.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test.describe.skip(!process.env.ANTHROPIC_API_KEY, "needs LLM key");

test("admin: generate → publish → appears on dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Use demo credentials" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/studio");
  await page.getByPlaceholder(/Bar chart of won deals/).fill("Bar chart of opportunities grouped by stage, count.");
  await page.getByRole("button", { name: /Generate/ }).click();

  // Wait until the renderer shows something (not the empty state)
  await expect(page.getByText("Preview")).toBeVisible();
  await page.waitForTimeout(6000); // LLM latency

  await page.getByRole("button", { name: /Approve & publish/ }).click();

  await page.goto("/dashboard");
  await page.getByRole("tab", { name: "Custom widgets" }).click();
  await expect(page.locator("text=/stage|count|opport/i").first()).toBeVisible();
});
```

- [ ] **Step 3: Append to `README.md`**

After the "What's inside" section:

```markdown
### AI Widget Builder

Admins can generate dashboard widgets from a natural-language prompt via `/dashboard/studio`. Behind the scenes, `POST /api/widgets/generate` calls Claude with tool use to emit one of 6 widget types (`stat_tile`, `bar_chart`, `line_chart`, `pie_chart`, `record_table`, `activity_feed`), parsed against a Zod discriminated union. The resulting spec renders deterministically via `<WidgetRenderer>` on the dashboard's Custom widgets tab.

Requires `ANTHROPIC_API_KEY` in the environment. Non-admins see a 403 when calling `/api/widgets/generate`.
```

- [ ] **Step 4: Verify build + test suites**

```bash
pnpm build
pnpm test
```

Expected: all 45 unit tests pass; build green.

- [ ] **Step 5: Commit**

```bash
git add app/(app)/dashboard/widget/[id]/page.tsx e2e/widget-builder.spec.ts README.md
git commit -m "feat(widgets): share-review route + E2E + docs"
```

---

## Self-review (done)

**Spec coverage:**
- Widget catalog (6 types) ✅ Task 2
- DataSource storage + admin gating ✅ Task 3
- Role system ✅ Tasks 1, 4
- CRUD + transition ✅ Tasks 5, 6
- LLM generate + retry ✅ Task 7
- Query hooks ✅ Task 8
- Aggregate pure function ✅ Task 9
- Renderer ✅ Task 10
- Custom widgets tab + empty state gallery ✅ Tasks 11, 12
- Studio page (prompt + form + preview + actions) ✅ Task 13
- Copyable review URL + read-only render ✅ Task 14
- Playwright smoke + README ✅ Task 14

**Placeholders:** none.

**Type consistency:** `WidgetSpec`, `GeneratedWidget`, `WidgetState`, `TransitionContext`, `DataSourceKey`, `Filter`, `Bucket`, `Agg` are defined in Task 2 and used consistently in Tasks 3, 5, 6, 7, 8, 9, 10. Hook names `useWidgets`, `useWidget`, `useGenerateWidget`, `useCreateWidget`, `useUpdateWidget`, `useTransitionWidget`, `useDeleteWidget` defined in Task 8 and used in Tasks 11, 13, 14.

**Open items that are intentionally deferred (noted in spec):**
- Natural-language editing — v2
- Per-admin audit log surface — v2
- Widget resize / drag — v2
