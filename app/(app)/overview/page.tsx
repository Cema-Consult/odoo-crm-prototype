"use client";
import Link from "next/link";
import { useActivities, useToggleActivity } from "@/lib/api-client/activities";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useContacts } from "@/lib/api-client/contacts";
import { useUsers } from "@/lib/api-client/users";
import { useStages } from "@/lib/api-client/stages";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Phone, Mail, Calendar, CheckSquare, AlertTriangle, Flame, Star, ArrowRight,
} from "lucide-react";
import { format, isPast, isToday, parseISO, startOfDay } from "date-fns";
import clsx from "clsx";

const ICON = { call: Phone, email: Mail, meeting: Calendar, todo: CheckSquare };

export default function OverviewPage() {
  const acts = useActivities().data ?? [];
  const opps = useOpportunities().data ?? [];
  const contacts = useContacts().data ?? [];
  const users = useUsers().data ?? [];
  const stages = useStages().data ?? [];
  const toggle = useToggleActivity();

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

  // Deals needing attention: open stage, high priority (>=2), no upcoming activity within 7 days
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

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 18 ? "Good afternoon" : "Good evening";

  const totalActionable = overdue.length + today.length + hotDeals.length;

  return (
    <div className="p-6 space-y-5 max-w-[1080px]">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {greeting}{currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-text-muted text-sm">
          {totalActionable === 0
            ? "You're all caught up. Nothing needs your attention today."
            : `You have ${totalActionable} item${totalActionable === 1 ? "" : "s"} waiting — ${overdue.length} overdue, ${today.length} today, ${hotDeals.length} hot deal${hotDeals.length === 1 ? "" : "s"} without activity.`}
        </p>
      </header>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill Icon={AlertTriangle} label="Overdue" value={overdue.length} accent="danger" />
        <StatPill Icon={Calendar} label="Today" value={today.length} accent="accent" />
        <StatPill Icon={Flame} label="Hot deals" value={hotDeals.length} accent="warning" />
      </div>

      {/* Overdue */}
      <Section
        title="Overdue"
        subtitle="These need your attention now"
        tone="danger"
        empty="No overdue activities — well done."
        count={overdue.length}
      >
        {overdue.map(a => {
          const Icon = ICON[a.type];
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

      {/* Today */}
      <Section
        title="Today"
        subtitle="Scheduled for today"
        tone="accent"
        empty="Nothing scheduled for today."
        count={today.length}
      >
        {today.map(a => {
          const Icon = ICON[a.type];
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

      {/* Hot deals */}
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
    </div>
  );
}

function StatPill({
  Icon, label, value, accent,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: "danger" | "accent" | "warning";
}) {
  const color = accent === "danger" ? "text-danger" : accent === "warning" ? "text-warning" : "text-accent";
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3">
      <Icon className={clsx("h-5 w-5", color)} />
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
        <div className="text-xl font-semibold leading-tight">{value}</div>
      </div>
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
