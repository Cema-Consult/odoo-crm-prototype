"use client";
import { useActivities, useToggleActivity } from "@/lib/api-client/activities";
import { useOpportunities } from "@/lib/api-client/opportunities";
import { useUsers } from "@/lib/api-client/users";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Phone, Mail, Calendar, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { format, isToday, isPast, parseISO, startOfDay } from "date-fns";
import clsx from "clsx";

const ICON = { call: Phone, email: Mail, meeting: Calendar, todo: CheckSquare };

export default function ActivitiesPage() {
  const acts = useActivities().data ?? [];
  const opps = useOpportunities().data ?? [];
  const users = useUsers().data ?? [];
  const toggle = useToggleActivity();
  const oppsById = new Map(opps.map(o => [o.id, o]));
  const usersById = new Map(users.map(u => [u.id, u]));

  const today = acts.filter(a => !a.done && isToday(parseISO(a.scheduledAt)));
  const upcoming = acts.filter(a => !a.done && parseISO(a.scheduledAt) > startOfDay(new Date()));

  const groupedUpcoming = upcoming.reduce<Record<string, typeof acts>>((acc, a) => {
    const key = a.scheduledAt.slice(0, 10);
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  const Row = ({ a }: { a: (typeof acts)[number] }) => {
    const Icon = ICON[a.type];
    const overdue = !a.done && isPast(parseISO(a.scheduledAt));
    return (
      <div className="flex items-center gap-3 py-2 border-b border-border text-sm">
        <Checkbox checked={a.done} onCheckedChange={v => toggle.mutate({ id: a.id, done: !!v })} />
        <Icon className="h-4 w-4 text-accent" />
        <span className={clsx("flex-1", a.done && "line-through text-text-muted")}>{a.summary}</span>
        {overdue && <span className="text-xs text-danger">overdue</span>}
        <Link href={`/opportunities/${a.opportunityId}`} className="text-xs text-text-muted hover:text-text truncate max-w-[200px]">
          {oppsById.get(a.opportunityId)?.name}
        </Link>
        <span className="text-xs text-text-muted w-[100px] text-right">{usersById.get(a.assignedTo)?.name}</span>
        <span className="text-xs text-text-muted w-[80px] text-right">{format(parseISO(a.scheduledAt), "HH:mm")}</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Activities</h1>
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
          <TabsTrigger value="upcoming">All upcoming ({upcoming.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <div className="bg-surface border border-border rounded-lg p-4">
            {today.length === 0 ? <div className="text-sm text-text-muted">Nothing scheduled for today.</div> : today.map(a => <Row key={a.id} a={a} />)}
          </div>
        </TabsContent>
        <TabsContent value="upcoming">
          <div className="space-y-3">
            {Object.entries(groupedUpcoming).sort().map(([day, list]) => (
              <div key={day} className="bg-surface border border-border rounded-lg p-4">
                <div className="text-xs uppercase text-text-muted mb-2">{format(parseISO(day), "EEEE, MMM d")}</div>
                {list.map(a => <Row key={a.id} a={a} />)}
              </div>
            ))}
            {upcoming.length === 0 && <div className="text-sm text-text-muted">Nothing upcoming.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
