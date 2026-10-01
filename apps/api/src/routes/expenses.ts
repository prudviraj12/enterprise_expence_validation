import { ClaimStatus, Role, type Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { writeAudit } from "../services/audit.js";
import { notifyUser } from "../services/notifications.js";
import { evaluatePolicies } from "../services/policies.js";

export const expensesRouter = Router();
expensesRouter.use(authenticate);

const itemSchema = z.object({
  category: z.string().trim().min(1).max(80),
  amount: z.number().positive().finite(),
  tax: z.number().nonnegative().finite().optional(),
  expenseDate: z.string().date(),
  merchant: z.string().trim().max(160).optional()
});

const claimSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  businessPurpose: z.string().trim().min(2).max(1000),
  departmentId: z.string().uuid().optional(),
  project: z.string().trim().max(160).optional(),
  costCenter: z.string().trim().max(80).optional(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  items: z.array(itemSchema).min(1).max(50),
  saveAsDraft: z.boolean().default(false)
});

function canSeeClaim(claim: { employeeId: string; employee: { managerId: string | null } }, userId: string, roles: Role[]): boolean {
  return claim.employeeId === userId ||
    claim.employee.managerId === userId ||
    roles.some((role) => role === Role.FINANCE || role === Role.ADMIN);
}

function listVisibility(userId: string, roles: Role[]): Prisma.ExpenseClaimWhereInput {
  const canSeeAll = roles.some((role) => role === Role.FINANCE || role === Role.ADMIN);
  if (canSeeAll) return {};
  if (roles.includes(Role.MANAGER)) {
    return { OR: [{ employeeId: userId }, { employee: { managerId: userId } }] };
  }
  return { employeeId: userId };
}

async function recordPolicyReviews(claimId: string, violations: Awaited<ReturnType<typeof evaluatePolicies>>): Promise<void> {
  if (violations.length === 0) return;
  await prisma.aIResult.createMany({
    data: violations.map((violation) => ({
      claimId,
      decision: "REVIEW",
      reason: violation.reason,
      policyViolated: violation.policyName,
      recommendation: violation.recommendation,
      verificationConfidence: 1
    }))
  });
}

async function createClaim(userId: string, input: z.infer<typeof claimSchema>, ipAddress?: string) {
  const profile = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true, employeeLevel: true, managerId: true } });
  const amount = input.items.reduce((sum, item) => sum + item.amount, 0);
  const status = input.saveAsDraft ? ClaimStatus.DRAFT : ClaimStatus.MANAGER_REVIEW;
  const claim = await prisma.expenseClaim.create({
    data: {
      employeeId: userId,
      departmentId: input.departmentId ?? profile?.departmentId,
      title: input.title,
      description: input.description,
      businessPurpose: input.businessPurpose,
      project: input.project,
      costCenter: input.costCenter,
      currency: input.currency,
      totalAmount: amount,
      status,
      submittedAt: input.saveAsDraft ? null : new Date(),
      items: { create: input.items.map((item) => ({ ...item, expenseDate: new Date(`${item.expenseDate}T00:00:00.000Z`) })) }
    },
    include: { items: true }
  });

  if (!input.saveAsDraft) {
    const violations = await evaluatePolicies({
      departmentId: claim.departmentId,
      employeeLevel: profile?.employeeLevel,
      items: input.items.map((item) => ({ ...item, currency: input.currency }))
    });
    await recordPolicyReviews(claim.id, violations);
    if (profile?.managerId) await notifyUser(profile.managerId, "Expense submitted", `${claim.title} is ready for manager review.`);
    await writeAudit({ userId, action: "SUBMIT_EXPENSE", entity: "ExpenseClaim", entityId: claim.id, newValue: { status, totalAmount: amount }, ipAddress });
  } else {
    await writeAudit({ userId, action: "CREATE_EXPENSE_DRAFT", entity: "ExpenseClaim", entityId: claim.id, newValue: { status, totalAmount: amount }, ipAddress });
  }
  return claim;
}

expensesRouter.post("/", async (req, res, next) => {
  try {
    const input = claimSchema.parse(req.body);
    const claim = await createClaim(req.auth!.userId, input, req.ip);
    res.status(201).json(claim);
  } catch (error) {
    next(error);
  }
});

expensesRouter.get("/", async (req, res, next) => {
  try {
    const status = req.query.status ? z.nativeEnum(ClaimStatus).parse(req.query.status) : undefined;
    const claims = await prisma.expenseClaim.findMany({
      where: { ...listVisibility(req.auth!.userId, req.auth!.roles), ...(status ? { status } : {}) },
      include: { employee: { select: { id: true, name: true, email: true } }, department: true, items: { include: { receipts: true } }, approvals: true, payment: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json(claims);
  } catch (error) {
    next(error);
  }
});

expensesRouter.get("/:id", async (req, res, next) => {
  try {
    const claim = await prisma.expenseClaim.findUnique({
      where: { id: req.params.id },
      include: { employee: true, department: true, items: { include: { receipts: true } }, approvals: { include: { actor: { select: { id: true, name: true } } } }, payment: true, aiResults: true, fraudReports: true }
    });
    if (!claim) {
      res.status(404).json({ error: "Expense claim not found." });
      return;
    }
    if (!canSeeClaim(claim, req.auth!.userId, req.auth!.roles)) {
      res.status(403).json({ error: "You cannot view this expense claim." });
      return;
    }
    res.json(claim);
  } catch (error) {
    next(error);
  }
});

expensesRouter.put("/:id", async (req, res, next) => {
  try {
    const input = claimSchema.parse({ ...req.body, saveAsDraft: true });
    const existing = await prisma.expenseClaim.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Expense claim not found." });
      return;
    }
    if (existing.employeeId !== req.auth!.userId || (existing.status !== ClaimStatus.DRAFT && existing.status !== ClaimStatus.RETURNED)) {
      res.status(409).json({ error: "Only your draft or returned claims can be edited." });
      return;
    }
    const claim = await prisma.expenseClaim.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        description: input.description,
        businessPurpose: input.businessPurpose,
        departmentId: input.departmentId,
        project: input.project,
        costCenter: input.costCenter,
        currency: input.currency,
        totalAmount: input.items.reduce((sum, item) => sum + item.amount, 0),
        items: {
          deleteMany: {},
          create: input.items.map((item) => ({ ...item, expenseDate: new Date(`${item.expenseDate}T00:00:00.000Z`) }))
        }
      },
      include: { items: true }
    });
    await writeAudit({ userId: req.auth!.userId, action: "UPDATE_EXPENSE", entity: "ExpenseClaim", entityId: claim.id, oldValue: { status: existing.status }, newValue: { status: claim.status, totalAmount: Number(claim.totalAmount) }, ipAddress: req.ip });
    res.json(claim);
  } catch (error) {
    next(error);
  }
});

expensesRouter.post("/:id/submit", async (req, res, next) => {
  try {
    const claim = await prisma.expenseClaim.findUnique({ where: { id: req.params.id }, include: { employee: true } });
    if (!claim) {
      res.status(404).json({ error: "Expense claim not found." });
      return;
    }
    if (claim.employeeId !== req.auth!.userId || (claim.status !== ClaimStatus.DRAFT && claim.status !== ClaimStatus.RETURNED)) {
      res.status(409).json({ error: "Only your draft or returned claims can be submitted." });
      return;
    }
    const updated = await prisma.expenseClaim.update({
      where: { id: claim.id },
      data: { status: ClaimStatus.MANAGER_REVIEW, submittedAt: new Date() }
    });
    if (claim.employee.managerId) await notifyUser(claim.employee.managerId, "Expense submitted", `${claim.title} is ready for manager review.`);
    await writeAudit({ userId: req.auth!.userId, action: "RESUBMIT_EXPENSE", entity: "ExpenseClaim", entityId: claim.id, oldValue: { status: claim.status }, newValue: { status: updated.status }, ipAddress: req.ip });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

expensesRouter.delete("/:id", async (req, res, next) => {
  try {
    const claim = await prisma.expenseClaim.findUnique({ where: { id: req.params.id } });
    if (!claim) {
      res.status(404).json({ error: "Expense claim not found." });
      return;
    }
    if (claim.employeeId !== req.auth!.userId || claim.status !== ClaimStatus.DRAFT) {
      res.status(409).json({ error: "Only your draft claims can be deleted." });
      return;
    }
    await writeAudit({ userId: req.auth!.userId, action: "DELETE_EXPENSE", entity: "ExpenseClaim", entityId: claim.id, oldValue: { status: claim.status }, ipAddress: req.ip });
    await prisma.expenseClaim.delete({ where: { id: claim.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});