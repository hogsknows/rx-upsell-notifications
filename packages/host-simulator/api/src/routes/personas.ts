import { Router } from "express";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DATE_RANGES, resolveDateRange } from "@uns/shared";
import type { KpiStore } from "../storage/kpiStore.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/personas.json");

// Release 1: organisation-level KPIs only
const RELEASE_1_USER_GROUP = "my_organization" as const;

interface Persona {
  id: string;
  name: string;
  role: string;
  isSiteAdmin: boolean;
  licenseTier: string;
  isOnTrial: boolean;
  tenantId: string;
  instanceFeatureFlag: boolean;
  tenantFeatureFlag: boolean;
}

async function loadPersonas(): Promise<Persona[]> {
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Persona[];
}

export function createPersonasRouter(kpiStore: KpiStore): Router {
  const router = Router();

  /**
   * GET /api/personas
   * Returns the list of test personas for the login screen.
   */
  router.get("/", async (_req, res, next) => {
    try {
      const personas = await loadPersonas();
      res.json(personas);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/user-context/:userId
   * Called by the Message Generator to get KPIs and feature flags for a user.
   *
   * KPIs are returned as a scope-keyed map:
   *   { "last_week|my_organization": { unTranscribedMinutes: 180, ... }, ... }
   *
   * Only scopes with at least one "value" entry in the KPI cache are included.
   * Scopes with no cached values are omitted — messages targeting that scope are dormant.
   */
  router.get("/user-context/:userId", async (req, res, next) => {
    try {
      const personas = await loadPersonas();
      const persona = personas.find((p) => p.id === req.params.userId);

      if (!persona) {
        res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
        return;
      }

      // Load all KPI cache entries for this tenant
      const cacheEntries = await kpiStore.getByTenant(persona.tenantId);
      const now = new Date();

      // Build scope-keyed kpis map from "value" entries only
      const kpis: Record<string, Record<string, number | string>> = {};

      for (const range of DATE_RANGES) {
        const { periodStart, periodEnd } = resolveDateRange(range, now);
        const scopeKey = `${range}|${RELEASE_1_USER_GROUP}`;

        const valueEntries = cacheEntries.filter(
          (e) =>
            e.entryType === "value" &&
            e.userGroup === RELEASE_1_USER_GROUP &&
            e.periodStart === periodStart &&
            e.periodEnd === periodEnd
        );

        if (valueEntries.length > 0) {
          kpis[scopeKey] = Object.fromEntries(
            valueEntries.map((e) => [e.kpiName, e.value as number | string])
          );
        }
        // Scopes with no value entries are intentionally omitted — dormant behaviour
      }

      res.json({
        userId: persona.id,
        tenantId: persona.tenantId,
        licenseTier: persona.licenseTier,
        isOnTrial: persona.isOnTrial,
        instanceFeatureFlag: persona.instanceFeatureFlag,
        tenantFeatureFlag: persona.tenantFeatureFlag,
        kpis,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
