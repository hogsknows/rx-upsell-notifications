import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.js";
import { createMessagesRouter } from "./routes/messages.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createJsonFileStore } from "./storage/jsonFileStore.js";
import { createMessageService } from "./services/messageService.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

const store = createJsonFileStore();
const service = createMessageService(store);

app.use(healthRouter);
app.use("/api/messages", createMessagesRouter(service));
app.use(errorHandler);

app.listen(Number(PORT), "127.0.0.1", () => {
  console.log(`Message Editor API running on http://127.0.0.1:${PORT}`);
});
