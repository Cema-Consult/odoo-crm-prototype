import type {
  Opportunity, Contact, Stage, Activity, User,
} from "@/lib/schemas/core";
import type { WidgetSpec, WidgetState } from "@/lib/schemas/widgets";

export type ListOpportunitiesParams = {
  stage?: string; q?: string; tag?: string; salespersonId?: string;
};
export type ListContactsParams = { q?: string; isCompany?: boolean };
export type ListActivitiesParams = { opportunityId?: string; assignedTo?: string; done?: boolean };

export type ListWidgetsParams = { state?: WidgetState; createdBy?: string };

export type TransitionContext = { by: string; isAdmin: boolean };

export type DashboardSummary = {
  pipelineValue: number;
  wonThisMonth: number;
  activitiesToday: number;
  newLeadsThisWeek: number;
  funnel: { stageId: string; name: string; count: number }[];
  forecast: { month: string; value: number }[];
  upcomingActivities: Activity[];
  recentlyWon: Opportunity[];
};

export interface DataSource {
  opportunities: {
    list(p: ListOpportunitiesParams): Promise<Opportunity[]>;
    get(id: string): Promise<Opportunity | null>;
    create(data: Omit<Opportunity, "id" | "createdAt">): Promise<Opportunity>;
    update(id: string, patch: Partial<Omit<Opportunity, "id" | "createdAt">>): Promise<Opportunity | null>;
    remove(id: string): Promise<boolean>;
    changeStage(id: string, stageId: string): Promise<Opportunity | null>;
  };
  contacts: {
    list(p: ListContactsParams): Promise<Contact[]>;
    get(id: string): Promise<Contact | null>;
    create(data: Omit<Contact, "id">): Promise<Contact>;
    update(id: string, patch: Partial<Omit<Contact, "id">>): Promise<Contact | null>;
  };
  stages: { list(): Promise<Stage[]> };
  users: { list(): Promise<User[]>; get(id: string): Promise<User | null> };
  activities: {
    list(p: ListActivitiesParams): Promise<Activity[]>;
    create(data: Omit<Activity, "id">): Promise<Activity>;
    update(id: string, patch: Partial<Omit<Activity, "id">>): Promise<Activity | null>;
  };
  dashboard: { summary(): Promise<DashboardSummary> };
  widgets: {
    list(p: ListWidgetsParams): Promise<WidgetSpec[]>;
    get(id: string): Promise<WidgetSpec | null>;
    create(data: Omit<WidgetSpec, "id" | "state" | "createdAt" | "approvedBy" | "approvedAt">): Promise<WidgetSpec>;
    update(id: string, patch: Partial<Omit<WidgetSpec, "id" | "createdAt" | "createdBy">>): Promise<WidgetSpec | null>;
    remove(id: string): Promise<boolean>;
    transition(id: string, next: WidgetState, ctx: TransitionContext): Promise<WidgetSpec | null>;
  };
}
