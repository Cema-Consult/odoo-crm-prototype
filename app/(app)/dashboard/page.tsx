"use client";
import Link from "next/link";
import { useDashboardSummary } from "@/lib/api-client/dashboard";
import { useActivities, useToggleActivity } from "@/lib/api-client/activities";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useContacts } from "@/lib/api-client/contacts";
import { useUsers } from "@/lib/api-client/users";
import { useStages } from "@/lib/api-client/stages";
import { StatTile } from "@/components/dashboard/stat-tile";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { ForecastChart } from "@/components/dashboard/forecast-chart";
import { RecentlyWon } from "@/components/dashboard/recently-won";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Phone, Mail, Calendar, CheckSquare, Star, ArrowRight } from "lucide-react";
import { format, isPast, isToday, parseISO, startOfDay } from "date-fns";
import clsx from "clsx";

const ACTIVITY_ICON = { call: Phone, email: Mail, meeting: Calendar, todo: CheckSquare };

const fmt = (n: number, cur = "EUR") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();
  const acts = useActivities().data ?? [];
  const opps = useOpportunities().data ?? [];
  const contacts = useContacts().data ?? [];
  const users = useUsers().data ?? [];
  const stages = useStages().data ?? [];
  const toggle = useToggleActivity();

  if (isLoading || !data) return <div className="p-6 text-text-muted">Loading…</div>;

  const oppsById = new Map(opps.map(o => [o.id, o]));
  const contactsById = new Map(contacts.map(c => [c.id, c]));
  const stagesById = new Map(stages.map(s => [s.id, s]));
  const currentUser = users[0];

  const overdue = acts
    .filter(a => !a.done && isPast(parseISO(a.scheduledAt)) && !isToday(parseISO(a.scheduledAt)))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const today = acts
    .filter(a => !a.done && isToday(parseISO(a.scheduledAt)))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const activeOpportunityIds = new Set(
    acts
      .filter(a => !a.done && parseISO(a.scheduledAt) >= startOfDay(new Date()))
      .map(a => a.opportunityId)
  );
  const hotDeals = opps
    .filter(o => !["s_won", "s_lost"].includes(o.stageId))
    .filter(o => o.priority >= 2)
    .filter(o => !activeOpportunityIds.has(o.id))
    .sort((a, b) => b.priority - a.priority || b.expectedRevenue - a.expectedRevenue)
    .slice(0, 6);

  const totalActionable = overdue.length + today.length + hotDeals.length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {greeting}{currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-text-muted text-sm">
          {totalActionable === 0
            ? "You're all caught up. Nothing needs your attention today."
            : `${totalActionable} task${totalActionable === 1 ? "" : "s"} waiting — ${overdue.length} overdue, ${today.length} today, ${hotDeals.length} hot deal${hotDeals.length === 1 ? "" : "s"} without activity.`}
        </p>
      </header>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline health</TabsTrigger>
          <TabsTrigger value="tasks">
            My tasks
            {totalActionable > 0 && (
              <span className="ml-2 text-[10px] font-semibold rounded-full bg-accent/20 text-accent px-1.5 py-0.5 leading-none">
                {totalActionable}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pipeline health tab */}
        <TabsContent value="pipeline" className="space-y-5 mt-4">
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
          <div>
            <RecentlyWon items={data.recentlyWon} />
          </div>
        </TabsContent>

        {/* My tasks tab */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <Section
            title="Overdue"
            subtitle="These need your attention now"
            tone="danger"
            empty="No overdue activities — well done."
            count={overdue.length}
          >
            {overdue.map(a => {
              const Icon = ACTIVITY_ICON[a.type];
              const opp = oppsById.get(a.opportunityId);
              const who = users.find(u => u.id === a.assignedTo)?.name ?? "—";
              return (
                <Row
                  key={a.id}
                  leading={<Checkbox checked={a.done} onCheckedChange={v => toggle.mutate({ id: a.id, done: !!v })} />}
                  icon={<Icon className="h-4 w-4 text-danger" />}
                  title={a.summary}
                  meta={
                    <>
                      {opp && <Link href={`/opportunities/${opp.id}`} className="hover:text-text truncate max-w-[260px]">{opp.name}</Link>}
                      <span>·</span>
                      <span>{format(parseISO(a.scheduledAt), "MMM d, HH:mm")}</span>
                      <span>·</span>
                      <span>{who}</span>
                    </>
                  }
                  right={<span className="text-xs text-danger font-medium">overdue</span>}
                />
              );
            })}
          </Section>

          <Section
            title="Today"
            subtitle="Scheduled for today"
            tone="accent"
            empty="Nothing scheduled for today."
            count={today.length}
          >
            {today.map(a => {
              const Icon = ACTIVITY_ICON[a.type];
              const opp = oppsById.get(a.opportunityId);
              const who = users.find(u => u.id === a.assignedTo)?.name ?? "—";
              return (
                <Row
                  key={a.id}
                  leading={<Checkbox checked={a.done} onCheckedChange={v => toggle.mutate({ id: a.id, done: !!v })} />}
                  icon={<Icon className="h-4 w-4 text-accent" />}
                  title={a.summary}
                  meta={
                    <>
                      {opp && <Link href={`/opportunities/${opp.id}`} className="hover:text-text truncate max-w-[260px]">{opp.name}</Link>}
                      <span>·</span>
                      <span>{format(parseISO(a.scheduledAt), "HH:mm")}</span>
                      <span>·</span>
                      <span>{who}</span>
                    </>
                  }
                />
              );
            })}
          </Section>

          <Section
            title="Hot deals without activity"
            subtitle="High-priority opportunities that have gone quiet"
            tone="warning"
            empty="Every high-priority deal has an upcoming activity."
            count={hotDeals.length}
          >
            {hotDeals.map(o => {
              const contact = contactsById.get(o.partnerId);
              return (
                <Link
                  key={o.id}
                  href={`/opportunities/${o.id}`}
                  className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 hover:bg-surface-muted/40 -mx-5 px-5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{o.name}</div>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span>{contact?.name ?? "—"}</span>
                      <span>·</span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4">{stagesById.get(o.stageId)?.name}</Badge>
                      <span>·</span>
                      <span>{o.currency} {o.expectedRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Star key={i} className={clsx("h-3 w-3", i < o.priority ? "text-warning fill-warning" : "text-text-muted")} />
                    ))}
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-muted" />
                </Link>
              );
            })}
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({
  title, subtitle, tone, empty, count, children,
}: {
  title: string;
  subtitle: string;
  tone: "danger" | "accent" | "warning";
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  const toneBorder = tone === "danger" ? "border-l-danger" : tone === "warning" ? "border-l-warning" : "border-l-accent";
  return (
    <section className={clsx("bg-surface border border-border rounded-lg p-5 border-l-4", toneBorder)}>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
        <span className="text-xs text-text-muted">{count}</span>
      </div>
      {count === 0
        ? <div className="text-sm text-text-muted py-2">{empty}</div>
        : <div className="divide-y divide-border">{children}</div>}
    </section>
  );
}

function Row({
  leading, icon, title, meta, right,
}: {
  leading?: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  meta: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 text-sm">
      {leading}
      {icon}
      <div className="flex-1 min-w-0">
        <div className="truncate">{title}</div>
        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">{meta}</div>
      </div>
      {right}
    </div>
  );
}
