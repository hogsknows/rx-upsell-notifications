import { z } from "zod";
import { UPGRADE_PATHS, type UpgradePath } from "./license.js";
import { KPI_PLACEHOLDERS, type TriggerCondition } from "./kpi.js";

export type MessageStatus = "active" | "inactive";

export const DATE_RANGES = [
  "last_week",
  "last_fortnight",
  "current_week",
  "current_month",
  "last_month",
] as const;

export type DateRange = (typeof DATE_RANGES)[number];

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  last_week: "Last week",
  last_fortnight: "Last fortnight",
  current_week: "Current week",
  current_month: "Current month",
  last_month: "Last month",
};

export const USER_GROUPS = [
  "my_recording_network",
  "my_organization",
  "my_direct_reports",
] as const;

export type UserGroup = (typeof USER_GROUPS)[number];

export const USER_GROUP_LABELS: Record<UserGroup, string> = {
  my_recording_network: "My recording network",
  my_organization: "My organisation",
  my_direct_reports: "My direct reports",
};

export interface MessageScope {
  dateRange: DateRange;
  userGroup: UserGroup;
}

export interface MessageDefinition {
  id: string;
  title: string;
  body: string;
  upgradePath: UpgradePath;
  scope: MessageScope;
  triggerConditions: TriggerCondition[];
  status: MessageStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type MessageDefinitionInput = Omit<
  MessageDefinition,
  "id" | "createdAt" | "updatedAt"
>;

// Zod schemas for validation

const triggerConditionSchema = z.object({
  kpi: z.enum(KPI_PLACEHOLDERS),
  operator: z.enum(["gt", "gte", "lt", "lte", "eq"]),
  threshold: z.number(),
});

const scopeSchema = z.object({
  dateRange: z.enum([...DATE_RANGES]),
  userGroup: z.enum([...USER_GROUPS]),
});

export const messageInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Body is required"),
  upgradePath: z.enum(UPGRADE_PATHS as [UpgradePath, ...UpgradePath[]]),
  scope: scopeSchema,
  triggerConditions: z.array(triggerConditionSchema).default([]),
  status: z.enum(["active", "inactive"]).default("inactive"),
  displayOrder: z.number().int().min(0).default(0),
});

export const messagePartialSchema = messageInputSchema.partial();
