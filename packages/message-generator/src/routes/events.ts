import { Router } from "express";
import { optOut, resetUser, resetAll } from "../storage/deliveryStore.js";

export function createEventsRouter(): Router {
  const router = Router();

  /**
   * POST /api/events/disable
   * Body: { userId: string }
   *
   * User clicked "Disable Notifications" — permanently opt them out.
   */
  router.post("/disable", async (req, res, next) => {
    try {
      const { userId } = req.body as { userId?: string };
      if (!userId) {
        res.status(400).json({ error: "userId is required", code: "BAD_REQUEST" });
        return;
      }
      await optOut(userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/events/dismiss
   * Body: { userId: string, messageId: string }
   *
   * User dismissed a message. Already handled by markSeen on GetMessages,
   * but this endpoint allows the host app to signal an explicit dismissal.
   */
  router.post("/dismiss", async (req, res, next) => {
    try {
      const { userId } = req.body as { userId?: string; messageId?: string };
      if (!userId) {
        res.status(400).json({ error: "userId is required", code: "BAD_REQUEST" });
        return;
      }
      // Dismissal is already recorded at GetMessages time — no additional action needed.
      // This endpoint exists for future metric tracking by the UNS.
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/events/upgrade-request
   * Body: { userId: string, messageId: string }
   *
   * User clicked "Request Upgrade". Recorded here for metric tracking.
   */
  router.post("/upgrade-request", async (req, res, next) => {
    try {
      const { userId } = req.body as { userId?: string; messageId?: string };
      if (!userId) {
        res.status(400).json({ error: "userId is required", code: "BAD_REQUEST" });
        return;
      }
      // Metric hook — tracking to be implemented by UNS analytics layer.
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/reset
   * Body: { userId?: string }
   *
   * Resets delivery state. If userId provided, resets that user only.
   * If omitted, resets all users. Intended for reseller/tenant manager testing.
   */
  router.post("/reset", async (req, res, next) => {
    try {
      const { userId } = req.body as { userId?: string };
      if (userId) {
        await resetUser(userId);
        res.json({ success: true, reset: "user", userId });
      } else {
        await resetAll();
        res.json({ success: true, reset: "all" });
      }
    } catch (err) {
      next(err);
    }
  });

  return router;
}
