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
