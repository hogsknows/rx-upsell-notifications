import { Router } from "express";
import type { KpiCacheEntryInput } from "@uns/shared";
import { KPI_PLACEHOLDERS, USER_GROUPS, USER_SCOPED_GROUPS } from "@uns/shared";
import type { KpiStore } from "../storage/kpiStore.js";

export function createKpisRouter(store: KpiStore): Router {
  const router = Router();

  /**
   * GET /api/kpis
   * List KPI cache entries. Supports ?tenantId= and ?entryType= filters.
   *
   * Use ?entryType=requested to discover which KPIs a background process needs to compute.
   * Use ?entryType=value to see all available computed values.
   */
  router.get("/", async (req, res, next) => {
    try {
      const { tenantId, userId, entryType } = req.query as Record<string, string | undefined>;

      if (entryType && entryType !== "value" && entryType !== "requested") {
        res.status(400).json({ error: "entryType must be 'value' or 'requested'", code: "BAD_REQUEST" });
        return;
      }

      const entries = await store.getAll({
        tenantId,
        userId,
        entryType: entryType as "value" | "requested" | undefined,
      });

      res.json(entries);
    } catch (err) {
      next(err);
    }
  });

  /**
   * PUT /api/kpis
   * Upsert a KPI cache entry. Matches on the natural key:
   *   (tenantId, userId?, kpiName, userGroup, periodStart, periodEnd)
   *
   * userId is required when userGroup is my_recording_network or my_direct_reports.
   *
   * To record that a KPI is needed:   { entryType: "requested", tenantId, [userId], kpiName, userGroup, periodStart, periodEnd }
   * To supply a computed value:        { entryType: "value",     tenantId, [userId], kpiName, userGroup, periodStart, periodEnd, value }
   *
   * Upserting a "value" over a "requested" entry promotes it and preserves requestedAt.
   */
  router.put("/", async (req, res, next) => {
    try {
      const body = req.body as Partial<KpiCacheEntryInput>;

      // Validate required fields
      if (!body.tenantId || typeof body.tenantId !== "string") {
        res.status(400).json({ error: "tenantId is required", code: "BAD_REQUEST" });
        return;
      }
      if (!body.kpiName || !(KPI_PLACEHOLDERS as readonly string[]).includes(body.kpiName)) {
        res.status(400).json({ error: `kpiName must be one of: ${KPI_PLACEHOLDERS.join(", ")}`, code: "BAD_REQUEST" });
        return;
      }
      if (!body.userGroup || !(USER_GROUPS as readonly string[]).includes(body.userGroup)) {
        res.status(400).json({ error: `userGroup must be one of: ${USER_GROUPS.join(", ")}`, code: "BAD_REQUEST" });
        return;
      }
      if ((USER_SCOPED_GROUPS as readonly string[]).includes(body.userGroup) && !body.userId) {
        res.status(400).json({
          error: `userId is required when userGroup is ${USER_SCOPED_GROUPS.join(" or ")}`,
          code: "BAD_REQUEST",
        });
        return;
      }
      if (!body.periodStart || !body.periodEnd) {
        res.status(400).json({ error: "periodStart and periodEnd are required", code: "BAD_REQUEST" });
        return;
      }
      if (body.entryType !== "value" && body.entryType !== "requested") {
        res.status(400).json({ error: "entryType must be 'value' or 'requested'", code: "BAD_REQUEST" });
        return;
      }
      if (body.entryType === "value" && body.value === undefined) {
        res.status(400).json({ error: "value is required when entryType is 'value'", code: "BAD_REQUEST" });
        return;
      }

      const entry = await store.upsert(body as KpiCacheEntryInput);
      res.json(entry);
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /api/kpis/:id
   * Remove a KPI cache entry by id.
   */
  router.delete("/:id", async (req, res, next) => {
    try {
      const deleted = await store.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "KPI entry not found", code: "NOT_FOUND" });
        return;
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
