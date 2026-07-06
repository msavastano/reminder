import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.js";
import remindersRouter from "./routes/reminders.js";
import caregiverPatientsRouter from "./routes/caregiverPatients.js";
import messagesRouter from "./routes/messages.js";
import aiRouter from "./routes/ai.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

// The mobile client is cross-origin and authenticates with an `Authorization:
// Bearer` header (no cookies), so CORS is enabled in every environment. In
// production the web SPA is same-origin with the API and never triggers CORS.
// Credentials (cookies) are only reflected in development, where the browser
// dev proxy needs them; the mobile client does not rely on credentialed CORS.
app.use(
  cors({
    origin: true,
    credentials: process.env.NODE_ENV === "development",
  }),
);

// Vercel's Services routing strips the "/api" routePrefix before forwarding
// here, so these routes are defined without it. Locally, the Vite dev proxy
// (frontend/vite.config.ts) strips the same prefix to match.
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/", remindersRouter);
app.use("/", caregiverPatientsRouter);
app.use("/", messagesRouter);
app.use("/", aiRouter);

export default app;
