"use client";
import { useDashboardSummary } from "@/lib/api-client/dashboard";
import { StatTile } from "@/components/dashboard/stat-tile";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { ForecastChart } from "@/components/dashboard/forecast-chart";
import { UpcomingActivities } from "@/components/dashboard/upcoming-activities";
import { RecentlyWon } from "@/components/dashboard/recently-won";

const fmt = (n: number, cur = "EUR") => new Intl.NumberFormat("en-GB", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();
  if (isLoading || !data) return <div className="p-6 text-text-muted">Loading…</div>;

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatTile label="Pipeline value" value={fmt(data.pipelineValue)} />
        <StatTile label="Won this month" value={fmt(data.wonThisMonth)} />
        <StatTile label="Activities today" value={data.activitiesToday} />
        <StatTile label="New leads this week" value={data.newLeadsThisWeek} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunnelChart data={data.funnel} />
        <ForecastChart data={data.forecast} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingActivities items={data.upcomingActivities} />
        <RecentlyWon items={data.recentlyWon} />
      </div>
    </div>
  );
}
