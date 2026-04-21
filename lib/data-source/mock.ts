import type { DataSource, DashboardSummary, ListOpportunitiesParams, ListContactsParams, ListActivitiesParams, ListWidgetsParams, TransitionContext } from "./types";
import type { Opportunity, Contact, Stage, Activity, User } from "@/lib/schemas/core";
import { nanoid } from "nanoid";
import type { WidgetSpec } from "@/lib/schemas/widgets";
import stagesSeed from "@/data/seed/stages.json";
import usersSeed from "@/data/seed/users.json";
import contactsSeed from "@/data/seed/contacts.json";
import opportunitiesSeed from "@/data/seed/opportunities.json";
import activitiesSeed from "@/data/seed/activities.json";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function makeMockDataSource(): DataSource {
  const stages: Stage[] = [...(stagesSeed as Stage[])];
  const users: User[] = [...(usersSeed as User[])];
  const contacts: Contact[] = [...(contactsSeed as Contact[])];
  const opportunities: Opportunity[] = [...(opportunitiesSeed as Opportunity[])];
  const activities: Activity[] = [...(activitiesSeed as Activity[])];
  const widgets: WidgetSpec[] = [];

  const now = () => new Date().toISOString();
  const widgetId = () => `w_${nanoid(10)}`;

  return {
    opportunities: {
      async list(p: ListOpportunitiesParams) {
        return opportunities.filter(o => {
          if (p.stage && o.stageId !== p.stage) return false;
          if (p.salespersonId && o.salespersonId !== p.salespersonId) return false;
          if (p.tag && !o.tags.includes(p.tag)) return false;
          if (p.q && !o.name.toLowerCase().includes(p.q.toLowerCase())) return false;
          return true;
        });
      },
      async get(id) { return opportunities.find(o => o.id === id) ?? null; },
      async create(data) {
        const o: Opportunity = { ...data, id: uid("o"), createdAt: now() };
        opportunities.push(o);
        return o;
      },
      async update(id, patch) {
        const i = opportunities.findIndex(o => o.id === id);
        if (i === -1) return null;
        opportunities[i] = { ...opportunities[i], ...patch };
        return opportunities[i];
      },
      async remove(id) {
        const i = opportunities.findIndex(o => o.id === id);
        if (i === -1) return false;
        opportunities.splice(i, 1);
        return true;
      },
      async changeStage(id, stageId) {
        return this.update(id, { stageId });
      },
    },
    contacts: {
      async list(p: ListContactsParams) {
        return contacts.filter(c => {
          if (p.isCompany !== undefined && c.isCompany !== p.isCompany) return false;
          if (p.q && !c.name.toLowerCase().includes(p.q.toLowerCase())) return false;
          return true;
        });
      },
      async get(id) { return contacts.find(c => c.id === id) ?? null; },
      async create(data) {
        const c: Contact = { ...data, id: uid("c") };
        contacts.push(c);
        return c;
      },
      async update(id, patch) {
        const i = contacts.findIndex(c => c.id === id);
        if (i === -1) return null;
        contacts[i] = { ...contacts[i], ...patch };
        return contacts[i];
      },
    },
    stages: { async list() { return [...stages].sort((a, b) => a.sequence - b.sequence); } },
    users: {
      async list() { return [...users]; },
      async get(id) { return users.find(u => u.id === id) ?? null; },
    },
    activities: {
      async list(p: ListActivitiesParams) {
        return activities.filter(a => {
          if (p.opportunityId && a.opportunityId !== p.opportunityId) return false;
          if (p.assignedTo && a.assignedTo !== p.assignedTo) return false;
          if (p.done !== undefined && a.done !== p.done) return false;
          return true;
        });
      },
      async create(data) {
        const a: Activity = { ...data, id: uid("a") };
        activities.push(a);
        return a;
      },
      async update(id, patch) {
        const i = activities.findIndex(a => a.id === id);
        if (i === -1) return null;
        activities[i] = { ...activities[i], ...patch };
        return activities[i];
      },
    },
    widgets: {
      async list(p: ListWidgetsParams) {
        return widgets.filter(w => {
          if (p.state && w.state !== p.state) return false;
          if (p.createdBy && w.createdBy !== p.createdBy) return false;
          return true;
        });
      },
      async get(id) { return widgets.find(w => w.id === id) ?? null; },
      async create(data) {
        const w = { ...data, id: widgetId(), state: "draft", createdAt: new Date().toISOString() } as WidgetSpec;
        widgets.push(w);
        return w;
      },
      async update(id, patch) {
        const i = widgets.findIndex(w => w.id === id);
        if (i === -1) return null;
        widgets[i] = { ...widgets[i], ...patch } as WidgetSpec;
        return widgets[i];
      },
      async remove(id) {
        const i = widgets.findIndex(w => w.id === id);
        if (i === -1) return false;
        widgets.splice(i, 1);
        return true;
      },
      async transition(id, next, ctx: TransitionContext) {
        const i = widgets.findIndex(w => w.id === id);
        if (i === -1) return null;
        if (next === "published" && !ctx.isAdmin) {
          throw new Error("admin role required to publish");
        }
        const patch: Partial<WidgetSpec> = { state: next };
        if (next === "published") {
          patch.approvedBy = ctx.by;
          patch.approvedAt = new Date().toISOString();
        }
        widgets[i] = { ...widgets[i], ...patch } as WidgetSpec;
        return widgets[i];
      },
    },
    dashboard: {
      async summary(): Promise<DashboardSummary> {
        const today = new Date();
        const month = today.toISOString().slice(0, 7);
        const weekAgo = new Date(today.getTime() - 7 * 864e5).toISOString();

        const pipelineValue = opportunities
          .filter(o => !["s_won", "s_lost"].includes(o.stageId))
          .reduce((sum, o) => sum + o.expectedRevenue, 0);

        const wonThisMonth = opportunities
          .filter(o => o.stageId === "s_won" && o.createdAt.startsWith(month))
          .reduce((s, o) => s + o.expectedRevenue, 0);

        const activitiesToday = activities.filter(a =>
          !a.done && a.scheduledAt.slice(0, 10) === today.toISOString().slice(0, 10)
        ).length;

        const newLeadsThisWeek = opportunities.filter(o => o.createdAt > weekAgo).length;

        const funnel = stages.filter(s => !s.fold).map(s => ({
          stageId: s.id,
          name: s.name,
          count: opportunities.filter(o => o.stageId === s.id).length,
        }));

        const forecast = Array.from({ length: 6 }).map((_, i) => {
          const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
          const key = d.toISOString().slice(0, 7);
          const value = opportunities
            .filter(o => o.expectedClose?.startsWith(key))
            .reduce((sum, o) => sum + o.expectedRevenue * (o.probability / 100), 0);
          return { month: key, value: Math.round(value) };
        });

        const upcomingActivities = activities
          .filter(a => !a.done && a.scheduledAt >= today.toISOString())
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
          .slice(0, 8);

        const recentlyWon = opportunities
          .filter(o => o.stageId === "s_won")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 5);

        return { pipelineValue, wonThisMonth, activitiesToday, newLeadsThisWeek, funnel, forecast, upcomingActivities, recentlyWon };
      },
    },
  };
}
