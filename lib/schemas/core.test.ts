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
