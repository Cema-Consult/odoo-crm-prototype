import { z } from "zod";

export const Currency = z.enum(["EUR", "USD", "DKK"]);
export const Priority = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

export const Stage = z.object({
  id: z.string(),
  name: z.string(),
  sequence: z.number().int(),
  fold: z.boolean(),
});

export const Role = z.enum(["admin", "viewer"]);
export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  avatar: z.string(),
  role: Role.default("viewer"),
});

export const Contact = z.object({
  id: z.string(),
  name: z.string(),
  isCompany: z.boolean(),
  parentId: z.string().nullable(),
  email: z.string(),
  phone: z.string(),
  title: z.string().nullable(),
  city: z.string(),
  country: z.string(),
  tags: z.array(z.string()),
});

export const Opportunity = z.object({
  id: z.string(),
  name: z.string(),
  partnerId: z.string(),
  salespersonId: z.string(),
  stageId: z.string(),
  expectedRevenue: z.number().nonnegative(),
  probability: z.number().min(0).max(100),
  currency: Currency,
  tags: z.array(z.string()),
  priority: Priority,
  createdAt: z.string(),
  expectedClose: z.string().nullable(),
  description: z.string(),
});

export const ActivityType = z.enum(["call", "meeting", "email", "todo"]);
export const Activity = z.object({
  id: z.string(),
  opportunityId: z.string(),
  type: ActivityType,
  summary: z.string(),
  scheduledAt: z.string(),
  done: z.boolean(),
  assignedTo: z.string(),
});

export type Stage = z.infer<typeof Stage>;
export type User = z.infer<typeof User>;
export type Role = z.infer<typeof Role>;
export type Contact = z.infer<typeof Contact>;
export type Opportunity = z.infer<typeof Opportunity>;
export type Activity = z.infer<typeof Activity>;

export const OpportunityCreate = Opportunity.omit({ id: true, createdAt: true });
export const OpportunityPatch = Opportunity.partial().omit({ id: true, createdAt: true });
export const ContactCreate = Contact.omit({ id: true });
export const ContactPatch = Contact.partial().omit({ id: true });
export const ActivityCreate = Activity.omit({ id: true });
export const ActivityPatch = Activity.partial().omit({ id: true });

export const ListOpportunitiesQuery = z.object({
  stage: z.string().optional(),
  q: z.string().optional(),
  tag: z.string().optional(),
  salespersonId: z.string().optional(),
});
export const StageChange = z.object({ stageId: z.string() });
