import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { expensesRouter } from "./routes/expenses.js";
import { receiptsRouter } from "./routes/receipts.js";

export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "expense-api" }));
app.use("/auth", authRouter);
app.use("/expenses", expensesRouter);
app.use("/receipts", receiptsRouter);
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) { res.status(400).json({ error: "Validation failed.", issues: error.issues }); return; }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { res.status(409).json({ error: "A record with those details already exists." }); return; }
  console.error(error);
  res.status(500).json({ error: "An unexpected error occurred." });
};
app.use(errorHandler);

const server = app.listen(config.PORT, () => console.log(`Expense API listening on http://localhost:${config.PORT}`));
async function shutdown() { server.close(async () => { await prisma.$disconnect(); process.exit(0); }); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
