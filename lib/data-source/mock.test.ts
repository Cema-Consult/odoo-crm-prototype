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
