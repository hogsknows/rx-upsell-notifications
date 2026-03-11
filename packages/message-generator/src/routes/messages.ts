import { Router } from "express";
import { resolveDateRange } from "@uns/shared";
import { getUserContext } from "../services/hostApiClient.js";
import { evaluateMessages } from "../services/messageEvaluator.js";
import { getUserState, markSeen } from "../storage/deliveryStore.js";

const HOST_API_URL = process.env.HOST_API_URL ?? "http://127.0.0.1:3003";

export function createMessagesRouter(): Router {
  const router = Router();

  /**
   * GET /api/messages?userId={guid}
   *
   * Called by the RX host app on successful user login.
   * Returns the ordered list of upsell messages to display, with placeholders resolved.
   * Marks returned messages as seen so they are not shown again.
   *
   * When a message is dormant (required KPI absent), a "requested" record is written
   * back to the host API so the background process knows what to compute next.
   */
  router.get("/", async (req, res, next) => {
    try {
      const { userId } = req.query as Record<string, string | undefined>;

      if (!userId) {
        res.status(400).json({ error: "userId query parameter is required", code: "BAD_REQUEST" });
        return;
      }

      // Fetch user context and delivery state in parallel
      const [context, deliveryState] = await Promise.all([
        getUserContext(userId),
        getUserState(userId),
      ]);

      // Bail immediately if user has opted out
      if (deliveryState.optedOut) {
        res.json({ messages: [], reason: "opted_out" });
        return;
      }

      /**
       * Callback invoked by the evaluator when a required KPI is absent.
       * Writes a "requested" entry to the host KPI cache so the background
       * process can discover and compute it.
       * scopeKey format: "${dateRange}|${userGroup}" e.g. "last_week|my_organization"
       */
      const requestKpi = async (kpiName: string, scopeKey: string): Promise<void> => {
        const [dateRange, userGroup] = scopeKey.split("|") as [string, string];
        const { periodStart, periodEnd } = resolveDateRange(
          dateRange as Parameters<typeof resolveDateRange>[0]
        );

        const body = {
          entryType: "requested",
          tenantId: context.tenantId,
          kpiName,
          userGroup,
          periodStart,
          periodEnd,
        };

        const response = await fetch(`${HOST_API_URL}/api/kpis`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Host KPI API returned ${response.status} for ${kpiName}`);
        }
      };

      const messages = await evaluateMessages(context, deliveryState.seenMessageIds, requestKpi);

      // Mark these messages as seen so they won't be returned on next login
      if (messages.length > 0) {
        await markSeen(userId, messages.map((m) => m.id));
      }

      res.json({ messages });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
