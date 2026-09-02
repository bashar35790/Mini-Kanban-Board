import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import usersRouter from "./routes/users";
import boardsRouter from "./routes/boards";
import columnsRouter from "./routes/columns";
import tasksRouter from "./routes/tasks";

const app = express();

// 1. CORS first — handles preflight OPTIONS and sets headers for every path (incl. /api/auth/*)
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// 2. Better Auth before body parsing — it reads the raw request stream itself;
//    express.json() would otherwise drain the body and break sign-up/sign-in.
//    *splat (Express 5) — bare * is rejected by Express 5's route parser
app.all("/api/auth/*splat", toNodeHandler(auth));

// 3. express.json() only for your own /api/v1/* routes (they need a parsed JSON body)
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── API v1 Routes ────────────────────────────────────────────────────────────
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/boards", boardsRouter);
app.use("/api/v1/columns", columnsRouter);
app.use("/api/v1/tasks", tasksRouter);

// Task creation uses /columns/:columnId/tasks — mounted under /api/v1
app.use("/api/v1", tasksRouter);

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Backend listening on ${process.env.PORT || 5000}`);
});
