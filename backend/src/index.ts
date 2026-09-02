import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const app = express();

// 1. CORS first — handles preflight OPTIONS and sets headers for every path (incl. /api/auth/*)
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// 2. Better Auth before body parsing — it reads the raw request stream itself;
//    express.json() would otherwise drain the body and break sign-up/sign-in
//    *splat (Express 5) — bare * is rejected by Express 5's route parser
app.all("/api/auth/*splat", toNodeHandler(auth));

// 3. express.json() only for your own /api/v1/* routes (they need a parsed JSON body)
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Backend listening on ${process.env.PORT || 5000}`);
});
