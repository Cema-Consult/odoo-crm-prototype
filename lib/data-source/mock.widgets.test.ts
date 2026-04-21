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
