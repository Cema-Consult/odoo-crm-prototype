"use client";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";

export function ForecastChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 h-[280px]">
      <div className="text-sm font-medium mb-3">Weighted forecast (next 6 months)</div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--accent-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
          <YAxis stroke="var(--text-muted)" fontSize={11} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <Area type="monotone" dataKey="value" stroke="var(--accent-2)" fill="url(#grad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
