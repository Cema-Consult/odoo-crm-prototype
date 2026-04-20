import type {
  Opportunity, Contact, Stage, Activity, User,
} from "@/lib/schemas/core";

export type ListOpportunitiesParams = {
  stage?: string; q?: string; tag?: string; salespersonId?: string;
};
export type ListContactsParams = { q?: string; isCompany?: boolean };
export type ListActivitiesParams = { opportunityId?: string; assignedTo?: string; done?: boolean };

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
}
