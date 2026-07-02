import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.js";
import remindersRouter from "./routes/reminders.js";
import caregiverPatientsRouter from "./routes/caregiverPatients.js";
import messagesRouter from "./routes/messages.js";
import aiRouter from "./routes/ai.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(cors({ origin: true, credentials: true }));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api", remindersRouter);
app.use("/api", caregiverPatientsRouter);
app.use("/api", messagesRouter);
app.use("/api", aiRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
