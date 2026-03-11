import express from "express";
import cors from "cors";
import { createMessagesRouter } from "./routes/messages.js";
import { createEventsRouter } from "./routes/events.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT ?? 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", service: "message-generator" }));

// Core endpoint — called by RX host app on login
app.use("/api/messages", createMessagesRouter());

// User action events (dismiss, upgrade-request, disable, reset)
app.use("/api/events", createEventsRouter());

app.use(errorHandler);

app.listen(Number(PORT), "127.0.0.1", () => {
  const editorApi = process.env.MESSAGE_EDITOR_API_URL ?? "http://127.0.0.1:3001";
  const hostApi = process.env.HOST_API_URL ?? "mock (no HOST_API_URL set)";
  console.log(`Message Generator running on http://127.0.0.1:${PORT}`);
  console.log(`  → Message definitions from: ${editorApi}`);
  console.log(`  → User context from:         ${hostApi}`);
});
