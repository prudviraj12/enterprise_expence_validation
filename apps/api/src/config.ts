import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().default("postgresql://expense:expense@localhost:5432/expense"),
  JWT_ACCESS_SECRET: z.string().default("development-access-secret-change-before-production"),
  JWT_REFRESH_SECRET: z.string().default("development-refresh-secret-change-before-production"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  MAX_RECEIPT_SIZE_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  MAX_RECEIPTS_PER_CLAIM: z.coerce.number().int().positive().default(10),
  UPLOAD_DIR: z.string().default("./uploads"),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_S3_BUCKET: z.string().optional(),
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),
  OPENAI_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("expenses@example.com")
});

export const config = envSchema.parse(process.env);

if (config.NODE_ENV === "production" &&
    (config.JWT_ACCESS_SECRET.length < 32 || config.JWT_REFRESH_SECRET.length < 32)) {
  throw new Error("Production JWT secrets must each contain at least 32 characters.");
}

export const isProduction = config.NODE_ENV === "production";