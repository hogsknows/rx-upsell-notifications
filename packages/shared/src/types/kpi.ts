export const KPI_PLACEHOLDERS = [
  "unTranscribedMinutes",
  "totalCallsThisMonth",
  "averageCallDurationMinutes",
  "percentCallsUntagged",
  "activeUserCount",
  "licencedUserCount",
  "unlicencedUserCount",
  "countAbusiveCalls",
  "wordCloudWord1",
  "wordCloudWord2",
  "wordCloudWord3",
  "wordCloudWord4",
] as const;

export type KpiPlaceholderKey = (typeof KPI_PLACEHOLDERS)[number];

export type TriggerOperator = "gt" | "gte" | "lt" | "lte" | "eq";

export const TRIGGER_OPERATORS: { value: TriggerOperator; label: string }[] = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
];

export interface TriggerCondition {
  kpi: KpiPlaceholderKey;
  operator: TriggerOperator;
  threshold: number;
}

export type KpiEntryType = "value" | "requested";

/**
 * User groups whose KPI values are scoped to an individual user.
 * Entries for these groups must include a userId to avoid cache collisions
 * between users in the same organisation.
 */
export const USER_SCOPED_GROUPS = [
  "my_recording_network",
  "my_direct_reports",
] as const;

export type UserScopedGroup = (typeof USER_SCOPED_GROUPS)[number];

export interface KpiCacheEntry {
  id: string;
  entryType: KpiEntryType;
  tenantId: string;
  /**
   * Required when userGroup is my_recording_network or my_direct_reports.
   * Omitted for my_organization (tenant-wide values are shared across all users).
   */
  userId?: string;
  kpiName: KpiPlaceholderKey;
  userGroup: "my_recording_network" | "my_organization" | "my_direct_reports";
  periodStart: string;      // ISO date e.g. "2026-03-02"
  periodEnd: string;        // ISO date e.g. "2026-03-08"
  value?: number | string;  // present only when entryType === "value"
  computedAt?: string;      // ISO datetime — set when entryType === "value"
  requestedAt?: string;     // ISO datetime — set when entryType === "requested"
}

export type KpiCacheEntryInput = Omit<KpiCacheEntry, "id">;
