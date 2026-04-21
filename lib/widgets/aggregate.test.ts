import { describe, it, expect } from "vitest";
import { applyFilter, resolveTimeToken, aggregate, groupRows } from "./aggregate";
import type { Opportunity } from "@/lib/schemas/core";

const baseOpp: Opportunity = {
  id: "o1", name: "Acme — Web", partnerId: "c1", salespersonId: "u_anna",
  stageId: "s_qualified", expectedRevenue: 10_000, probability: 40, currency: "EUR",
  tags: ["enterprise"], priority: 2, createdAt: "2026-03-01T00:00:00Z",
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
