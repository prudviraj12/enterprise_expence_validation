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
import { workflowRouter } from "./routes/workflow.js";
import { managementRouter } from "./routes/management.js";

export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "expense-api" }));
app.get("/openapi.json", (_req, res) => res.json({
  openapi: "3.0.3",
  info: { title: "Ledgerly Expense API", version: "0.2.0" },
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/auth/login": { post: { summary: "Sign in" } },
    "/expenses": { get: { security: [{ bearerAuth: [] }], summary: "List visible claims" }, post: { security: [{ bearerAuth: [] }], summary: "Create a claim" } },
    "/receipts/items/{itemId}": { post: { security: [{ bearerAuth: [] }], summary: "Upload and analyze a receipt" } },
    "/claims/{id}/manager/{action}": { post: { security: [{ bearerAuth: [] }], summary: "Manager workflow decision" } },
    "/claims/{id}/finance/{action}": { post: { security: [{ bearerAuth: [] }], summary: "Finance workflow decision" } },
    "/claims/{id}/payment": { post: { security: [{ bearerAuth: [] }], summary: "Record reimbursement payment" } }
  }
}));
app.use("/auth", authRouter);
app.use("/expenses", expensesRouter);
app.use("/receipts", receiptsRouter);
app.use("/claims", workflowRouter);
app.use("/management", managementRouter);
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
