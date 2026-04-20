import { describe, it, expect } from "vitest";
import { Stage, User, Contact, Opportunity, Activity } from "./core";
import stagesSeed from "@/data/seed/stages.json";
import usersSeed from "@/data/seed/users.json";
import contactsSeed from "@/data/seed/contacts.json";
import opportunitiesSeed from "@/data/seed/opportunities.json";
import activitiesSeed from "@/data/seed/activities.json";

describe("seed data conforms to schemas", () => {
  it("stages", () => { stagesSeed.forEach((s: unknown) => expect(() => Stage.parse(s)).not.toThrow()); });
  it("users", () => { usersSeed.forEach((u: unknown) => expect(() => User.parse(u)).not.toThrow()); });
  it("contacts", () => { contactsSeed.forEach((c: unknown) => expect(() => Contact.parse(c)).not.toThrow()); });
  it("opportunities", () => { opportunitiesSeed.forEach((o: unknown) => expect(() => Opportunity.parse(o)).not.toThrow()); });
  it("activities", () => { activitiesSeed.forEach((a: unknown) => expect(() => Activity.parse(a)).not.toThrow()); });

  it("contact parentIds resolve", () => {
    const ids = new Set(contactsSeed.map((c: any) => c.id));
    const badParent = contactsSeed.filter((c: any) => c.parentId && !ids.has(c.parentId));
    expect(badParent).toEqual([]);
  });

  it("opportunity partnerIds resolve to companies", () => {
    const companies = new Set(contactsSeed.filter((c: any) => c.isCompany).map((c: any) => c.id));
    const bad = opportunitiesSeed.filter((o: any) => !companies.has(o.partnerId));
    expect(bad).toEqual([]);
  });

  it("opportunity salespersonIds resolve", () => {
    const users = new Set(usersSeed.map((u: any) => u.id));
    const bad = opportunitiesSeed.filter((o: any) => !users.has(o.salespersonId));
    expect(bad).toEqual([]);
  });

  it("opportunity stageIds resolve", () => {
    const stages = new Set(stagesSeed.map((s: any) => s.id));
    const bad = opportunitiesSeed.filter((o: any) => !stages.has(o.stageId));
    expect(bad).toEqual([]);
  });

  it("activity opportunityIds resolve", () => {
    const opps = new Set(opportunitiesSeed.map((o: any) => o.id));
    const bad = activitiesSeed.filter((a: any) => !opps.has(a.opportunityId));
    expect(bad).toEqual([]);
  });
});
