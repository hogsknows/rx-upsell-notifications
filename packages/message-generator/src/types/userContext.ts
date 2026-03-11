import type { LicenseTier } from "@uns/shared";

export interface UserContext {
  userId: string;
  tenantId: string;
  licenseTier: LicenseTier;
  isOnTrial: boolean;
  instanceFeatureFlag: boolean;
  tenantFeatureFlag: boolean;
  /**
   * KPI values keyed by scope, then by KPI name.
   * Key format: `${dateRange}|${userGroup}` e.g. "last_week|my_organization"
   *
   * If a scope key is absent, all messages for that scope are dormant.
   * If a specific KPI key is absent within a scope, messages requiring that KPI are dormant
   * and a "requested" record will be written back to the host API.
   */
  kpis: Record<string, Record<string, number | string>>;
}
