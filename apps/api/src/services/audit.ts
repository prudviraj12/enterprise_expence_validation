import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

export async function writeAudit(input: {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ipAddress?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      ...input,
      oldValue: input.oldValue,
      newValue: input.newValue
    }
  });
}