import { LicenseTier } from "@uns/shared";
import type { UserContext } from "../types/userContext.js";

const HOST_API_URL = process.env.HOST_API_URL ?? "http://127.0.0.1:3003";

/**
 * Mock user context returned when no real host API is configured.
 * Represents a typical Essential-tier user with Native KPI data available.
 * AI KPIs (countAbusiveCalls, wordCloudWord*) are intentionally absent to
 * demonstrate dormant message behaviour — messages depending on them won't show.
 * Replace by setting HOST_API_URL to point to the real RX host API or host simulator.
 */
function mockUserContext(userId: string): UserContext {
  return {
    userId,
    tenantId: "tenant-demo-001",
    licenseTier: LicenseTier.Essential,
    isOnTrial: false,
    instanceFeatureFlag: true,
    tenantFeatureFlag: true,
    kpis: {
      "last_week|my_organization": {
        unTranscribedMinutes: 180,
        totalCallsThisMonth: 120,
        averageCallDurationMinutes: 8,
        percentCallsUntagged: 45,
        activeUserCount: 15,
        licencedUserCount: 10,
        unlicencedUserCount: 5,
        // AI KPIs intentionally absent — messages requiring them will be dormant
      },
    },
  };
}

/**
 * Fetches user context (license tier, KPIs, feature flags) from the RX host API.
 * Falls back to mock data if HOST_API_URL is not configured.
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  if (!HOST_API_URL) {
    console.log(`[host-api] No HOST_API_URL set — using mock context for user ${userId}`);
    return mockUserContext(userId);
  }

  const url = `${HOST_API_URL}/api/user-context/${userId}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Host API returned ${response.status} for user ${userId}`);
  }

  return response.json() as Promise<UserContext>;
}
