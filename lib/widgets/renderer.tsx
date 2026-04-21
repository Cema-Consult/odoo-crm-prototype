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

function useRows(ds: DataSourceKey | undefined) {
  const opps = useOpportunities().data ?? [];
  const contacts = useContacts().data ?? [];
  const acts = useActivities().data ?? [];
  if (ds === "opportunities") return opps;
  if (ds === "contacts") return contacts;
  if (ds === "activities") return acts;
  return [];
}

const fmt = (n: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(n);

function Incomplete({ message }: { message: string }) {
  return <div className="text-sm text-text-muted py-6 text-center">{message}</div>;
}

export function WidgetRenderer({ spec }: { spec: WidgetSpec }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="text-sm font-medium mb-2">{spec.title || <span className="text-text-muted">Untitled widget</span>}</div>
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
  return <Incomplete message="Pick a widget type to see a preview." />;
}

function StatTileBody({ spec }: { spec: Extract<WidgetSpec, { type: "stat_tile" }> }) {
  const rows = useRows(spec.dataSource);
  const value = useMemo(() => {
    if (!spec.dataSource || !spec.metric) return null;
    try { return aggregate(spec, rows); } catch { return null; }
  }, [spec, rows]);
  if (!spec.dataSource) return <Incomplete message="Pick a data source." />;
  if (!spec.metric) return <Incomplete message="Pick a metric." />;
  return <div className="text-3xl font-semibold">{value === null ? "—" : fmt(value)}</div>;
}

function BarBody({ spec }: { spec: Extract<WidgetSpec, { type: "bar_chart" }> }) {
  const rows = useRows(spec.dataSource);
  const data = useMemo(() => {
    if (!spec.dataSource || !spec.groupBy || !spec.metric) return [];
    return groupRows(applyFilter(rows as any, spec.filter, spec.dataSource), spec.groupBy, spec.metric as any, spec.dataSource)
      .map(d => ({ name: d.key, value: d.value }));
  }, [spec, rows]);
  if (!spec.dataSource) return <Incomplete message="Pick a data source." />;
  if (!spec.groupBy) return <Incomplete message='Pick a "group by" dimension.' />;
  if (!spec.metric) return <Incomplete message="Pick a metric." />;
  return (
    <div className="h-[220px] min-w-0">
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
    if (!spec.dataSource || !spec.timeField || !spec.bucket || !spec.metric) return [];
    const filtered = applyFilter(rows as any, spec.filter, spec.dataSource);
    const shifted = filtered.map((r: any) => ({ ...r, createdAt: r[spec.timeField] ?? r.createdAt }));
    return groupRows(shifted, spec.bucket, spec.metric as any, spec.dataSource)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(d => ({ name: d.key, value: d.value }));
  }, [spec, rows]);
  if (!spec.dataSource) return <Incomplete message="Pick a data source." />;
  if (!spec.timeField || !spec.bucket) return <Incomplete message="Pick a time field and bucket." />;
  if (!spec.metric) return <Incomplete message="Pick a metric." />;
  return (
    <div className="h-[220px] min-w-0">
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
  const data = useMemo(() => {
    if (!spec.dataSource || !spec.groupBy || !spec.metric) return [];
    return groupRows(applyFilter(rows as any, spec.filter, spec.dataSource), spec.groupBy, spec.metric as any, spec.dataSource)
      .map(d => ({ name: d.key, value: d.value }));
  }, [spec, rows]);
  if (!spec.dataSource) return <Incomplete message="Pick a data source." />;
  if (!spec.groupBy) return <Incomplete message='Pick a "group by" dimension.' />;
  if (!spec.metric) return <Incomplete message="Pick a metric." />;
  return (
    <div className="h-[220px] min-w-0">
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
  const columns = spec.columns ?? [];
  const rows = useRows(spec.dataSource);
  const filtered = useMemo(() => applyFilter(rows as any, spec.filter, spec.dataSource ?? "opportunities"), [spec, rows]);
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
  if (!spec.dataSource) return <Incomplete message="Pick a data source." />;
  if (columns.length === 0) return <Incomplete message='Add at least one column (e.g. ["name","stageId"]).' />;
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-text-muted"><tr>{columns.map(c => <th key={c} className="text-left text-xs uppercase px-2 py-1">{c}</th>)}</tr></thead>
        <tbody>
          {limited.map((r: any) => (
            <tr key={r.id} className="border-t border-border">{columns.map(c => <td key={c} className="px-2 py-1 truncate max-w-[200px]">{String(r[c] ?? "—")}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityBody({ spec }: { spec: Extract<WidgetSpec, { type: "activity_feed" }> }) {
  const rows = useRows("activities");
  const filtered = useMemo(() => applyFilter(rows as any, spec.filter ?? {}, "activities"), [spec, rows]);
  const limited = filtered.slice(0, spec.limit ?? 10);
  return (
    <ul className="space-y-1 text-sm">
      {limited.map((a: any) => (
        <li key={a.id} className="flex items-center gap-2">
          <span className="text-text-muted text-xs">
            {a.scheduledAt ? format(parseISO(a.scheduledAt), "MMM d, HH:mm") : "—"}
          </span>
          <span className="truncate">{a.summary}</span>
        </li>
      ))}
      {limited.length === 0 && <li className="text-text-muted">No activities match.</li>}
    </ul>
  );
}
