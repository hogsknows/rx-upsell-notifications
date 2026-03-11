import { Router } from "express";
import { messageInputSchema, messagePartialSchema } from "@uns/shared";
import type { createMessageService } from "../services/messageService.js";

type MessageService = ReturnType<typeof createMessageService>;

export function createMessagesRouter(service: MessageService) {
  const router = Router();

  // GET /api/messages
  router.get("/", async (req, res, next) => {
    try {
      const { status, upgradePath } = req.query as Record<string, string | undefined>;
      const messages = await service.list({ status, upgradePath });
      res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/messages/:id
  router.get("/:id", async (req, res, next) => {
    try {
      const message = await service.get(req.params.id);
      if (!message) {
        res.status(404).json({ error: "Message not found", code: "NOT_FOUND" });
        return;
      }
      res.json(message);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/messages
  router.post("/", async (req, res, next) => {
    try {
      const result = messageInputSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Validation failed", code: "VALIDATION_ERROR", details: result.error.flatten() });
        return;
      }
      const message = await service.create(result.data as Parameters<typeof service.create>[0]);
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/messages/:id
  router.put("/:id", async (req, res, next) => {
    try {
      const result = messageInputSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Validation failed", code: "VALIDATION_ERROR", details: result.error.flatten() });
        return;
      }
      const message = await service.update(req.params.id, result.data as Parameters<typeof service.update>[1]);
      if (!message) {
        res.status(404).json({ error: "Message not found", code: "NOT_FOUND" });
        return;
      }
      res.json(message);
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/messages/:id
  router.patch("/:id", async (req, res, next) => {
    try {
      const result = messagePartialSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Validation failed", code: "VALIDATION_ERROR", details: result.error.flatten() });
        return;
      }
      const message = await service.update(req.params.id, result.data as Parameters<typeof service.update>[1]);
      if (!message) {
        res.status(404).json({ error: "Message not found", code: "NOT_FOUND" });
        return;
      }
      res.json(message);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/messages/:id
  router.delete("/:id", async (req, res, next) => {
    try {
      const deleted = await service.remove(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Message not found", code: "NOT_FOUND" });
        return;
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
