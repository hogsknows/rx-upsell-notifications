import express from "express";
import cors from "cors";
import { createPersonasRouter } from "./routes/personas.js";
import { createKpisRouter } from "./routes/kpis.js";
import { createKpiStore } from "./storage/kpiStore.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT ?? 3003;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "host-simulator-api" }));

const kpiStore = createKpiStore();
const personasRouter = createPersonasRouter(kpiStore);

app.use("/api/personas", personasRouter);

// /api/user-context/:userId is mounted on the personas router
app.use("/api", personasRouter);

// KPI cache table — used by message generator (write "requested") and background process (write "value")
app.use("/api/kpis", createKpisRouter(kpiStore));

app.use(errorHandler);

app.listen(Number(PORT), "127.0.0.1", () => {
  console.log(`Host Simulator API running on http://127.0.0.1:${PORT}`);
  console.log(`  → GET  /api/personas                  — list of test personas`);
  console.log(`  → GET  /api/user-context/:userId       — user context (scope-keyed KPIs)`);
  console.log(`  → GET  /api/kpis                       — list KPI cache entries`);
  console.log(`  → GET  /api/kpis?entryType=requested   — KPIs pending computation`);
  console.log(`  → PUT  /api/kpis                       — upsert a KPI value or request`);
  console.log(`  → DELETE /api/kpis/:id                 — remove a KPI entry`);
});
