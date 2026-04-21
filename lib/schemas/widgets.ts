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
  createdAfter: z.string().optional(),
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
const SERVER_ONLY = {
  id: true, state: true, createdBy: true, createdAt: true,
  approvedBy: true, approvedAt: true, prompt: true,
} as const;

export const GeneratedWidget = z.discriminatedUnion("type", [
  StatTile.omit(SERVER_ONLY),
  BarChart.omit(SERVER_ONLY),
  LineChart.omit(SERVER_ONLY),
  PieChart.omit(SERVER_ONLY),
  RecordTable.omit(SERVER_ONLY),
  ActivityFeed.omit(SERVER_ONLY),
]);
export type GeneratedWidget = z.infer<typeof GeneratedWidget>;

export const WidgetTransition = z.object({
  next: z.enum(["draft", "pending_review", "published", "archived"]),
});
