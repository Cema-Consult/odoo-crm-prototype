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
