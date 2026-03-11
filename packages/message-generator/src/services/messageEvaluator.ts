import type { MessageDefinition, TriggerCondition, UpgradePath } from "@uns/shared";
import { LicenseTier } from "@uns/shared";
import type { UserContext } from "../types/userContext.js";

const MESSAGE_EDITOR_API =
  process.env.MESSAGE_EDITOR_API_URL ?? "http://127.0.0.1:3001";

/** Upgrade paths a given license tier is eligible to see upsell messages for */
const ELIGIBLE_PATHS: Record<LicenseTier, UpgradePath[]> = {
  [LicenseTier.Essential]: ["Essential→Advanced", "Essential→UltimateIQ"],
  [LicenseTier.Advanced]: ["Advanced→UltimateIQ"],
  [LicenseTier.UltimateIQ]: [],
};

/** Fetch all active message definitions from the message editor API */
async function fetchActiveMessages(): Promise<MessageDefinition[]> {
  const res = await fetch(`${MESSAGE_EDITOR_API}/api/messages?status=active`);
  if (!res.ok) {
    throw new Error(`Message editor API returned ${res.status}`);
  }
  return res.json() as Promise<MessageDefinition[]>;
}

/** Evaluate a single trigger condition against a scope's KPI values */
function evaluateCondition(
  condition: TriggerCondition,
  scopeKpis: Record<string, number | string>
): boolean {
  const raw = scopeKpis[condition.kpi];
  if (typeof raw !== "number") return false; // string KPIs (e.g. word cloud) are display-only

  const { operator, threshold } = condition;
  switch (operator) {
    case "gt":  return raw > threshold;
    case "gte": return raw >= threshold;
    case "lt":  return raw < threshold;
    case "lte": return raw <= threshold;
    case "eq":  return raw === threshold;
    default:    return false;
  }
}

/** Resolve {{placeholder}} tokens in a string using a scope's KPI values */
function resolvePlaceholders(
  text: string,
  scopeKpis: Record<string, number | string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = scopeKpis[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

/** Extract all {{key}} placeholder names from a string */
function extractPlaceholderKeys(text: string): string[] {
  return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
}

/**
 * Returns the full set of KPI keys a message depends on.
 * Includes trigger condition KPIs and any {{placeholder}} keys in title/body.
 */
function requiredKpiKeys(message: MessageDefinition): Set<string> {
  return new Set([
    ...message.triggerConditions.map((c) => c.kpi),
    ...extractPlaceholderKeys(message.title),
    ...extractPlaceholderKeys(message.body),
  ]);
}

export interface ResolvedMessage {
  id: string;
  title: string;
  body: string;
  upgradePath: UpgradePath;
  displayOrder: number;
}

/**
 * Core evaluation pipeline.
 * Returns ordered messages that should be shown to this user.
 *
 * @param requestKpi - Optional callback invoked when a required KPI is absent.
 *   The host API will record this as a "requested" entry so a background process
 *   can compute it — unblocking the dormant message on a future login.
 */
export async function evaluateMessages(
  context: UserContext,
  seenMessageIds: string[],
  requestKpi?: (kpiName: string, scopeKey: string) => Promise<void>
): Promise<ResolvedMessage[]> {
  // 1. Feature flag gates
  if (!context.instanceFeatureFlag || !context.tenantFeatureFlag) return [];

  // 2. No upsell during trial — all tiers behave as UltimateIQ
  if (context.isOnTrial) return [];

  // 3. UltimateIQ users have nothing to upsell
  const eligiblePaths = ELIGIBLE_PATHS[context.licenseTier];
  if (eligiblePaths.length === 0) return [];

  // 4. Fetch active message definitions
  const allMessages = await fetchActiveMessages();

  // 5. Filter by eligible upgrade paths for this user's tier
  const pathFiltered = allMessages.filter((m) =>
    eligiblePaths.includes(m.upgradePath)
  );

  // 6. Dormant check + trigger evaluation (per message scope)
  const kpiRequests: Promise<void>[] = [];

  const triggered = pathFiltered.filter((m) => {
    const scopeKey = `${m.scope.dateRange}|${m.scope.userGroup}`;
    const scopeKpis = context.kpis[scopeKey] ?? {};

    // Check which required KPIs are missing from this scope
    const required = requiredKpiKeys(m);
    const missingKpis = [...required].filter((key) => !(key in scopeKpis));

    if (missingKpis.length > 0) {
      // Fire-and-forget KPI requests — don't block message delivery
      if (requestKpi) {
        for (const kpiName of missingKpis) {
          kpiRequests.push(
            requestKpi(kpiName, scopeKey).catch((err) =>
              console.warn(`[evaluator] Failed to request KPI "${kpiName}" for scope "${scopeKey}":`, err)
            )
          );
        }
      }
      // Message is dormant — required KPI data not yet available
      return false;
    }

    // All KPIs present — evaluate trigger conditions
    if (m.triggerConditions.length === 0) return true;
    return m.triggerConditions.every((c) => evaluateCondition(c, scopeKpis));
  });

  // Flush KPI requests in the background (don't await — doesn't affect response)
  void Promise.allSettled(kpiRequests);

  // 7. Filter out messages already seen by this user
  const unseen = triggered.filter((m) => !seenMessageIds.includes(m.id));

  // 8. Sort by displayOrder ascending
  unseen.sort((a, b) => a.displayOrder - b.displayOrder);

  // 9. Resolve placeholders in title and body using the message's own scope
  return unseen.map((m) => {
    const scopeKpis = context.kpis[`${m.scope.dateRange}|${m.scope.userGroup}`] ?? {};
    return {
      id: m.id,
      title: resolvePlaceholders(m.title, scopeKpis),
      body: resolvePlaceholders(m.body, scopeKpis),
      upgradePath: m.upgradePath,
      displayOrder: m.displayOrder,
    };
  });
}
