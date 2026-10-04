import { ApprovalStage, ClaimStatus, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { writeAudit } from "../services/audit.js";
import { notifyUser } from "../services/notifications.js";

export const workflowRouter = Router();
workflowRouter.use(authenticate);
const decisionSchema = z.object({ comment: z.string().trim().max(2000).optional() });
const pastTense: Record<string, string> = { approve: "approved", reject: "rejected", return: "returned", clarify: "returned for clarification", override: "overrode" };

async function claimForAction(id: string) {
  return prisma.expenseClaim.findUnique({ where: { id }, include: { employee: { select: { id: true, managerId: true, name: true } } } });
}

workflowRouter.post("/:id/manager/:action", requireRoles(Role.MANAGER), async (req, res, next) => {
  try {
    const action = z.enum(["approve", "reject", "return", "clarify"]).parse(req.params.action);
    const input = decisionSchema.parse(req.body);
    const claim = await claimForAction(req.params.id);
    if (!claim) { res.status(404).json({ error: "Expense claim not found." }); return; }
    if (claim.employee.managerId !== req.auth!.userId) { res.status(403).json({ error: "Only this employee's manager can decide the claim." }); return; }
    if (claim.status !== ClaimStatus.MANAGER_REVIEW) { res.status(409).json({ error: "Claim is not awaiting manager review." }); return; }
    const status = action === "approve" ? ClaimStatus.FINANCE_REVIEW : action === "reject" ? ClaimStatus.REJECTED : ClaimStatus.RETURNED;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.expenseClaim.update({ where: { id: claim.id }, data: { status } });
      await tx.approvalHistory.create({ data: { claimId: claim.id, actorId: req.auth!.userId, stage: ApprovalStage.MANAGER, action: action.toUpperCase(), comment: input.comment } });
      return result;
    });
    await notifyUser(claim.employeeId, `Claim ${pastTense[action]}`, `${claim.title}: ${input.comment ?? "No comment provided."}`);
    await writeAudit({ userId: req.auth!.userId, action: `MANAGER_${action.toUpperCase()}`, entity: "ExpenseClaim", entityId: claim.id, oldValue: { status: claim.status }, newValue: { status }, ipAddress: req.ip });
    res.json(updated);
  } catch (error) { next(error); }
});

workflowRouter.post("/:id/finance/:action", requireRoles(Role.FINANCE), async (req, res, next) => {
  try {
    const action = z.enum(["approve", "reject", "return", "override"]).parse(req.params.action);
    const input = z.object({ comment: z.string().trim().max(2000).optional() }).superRefine((value, ctx) => {
      if (action === "override" && !value.comment?.trim()) ctx.addIssue({ code: "custom", path: ["comment"], message: "An override reason is required." });
    }).parse(req.body);
    const claim = await claimForAction(req.params.id);
    if (!claim) { res.status(404).json({ error: "Expense claim not found." }); return; }
    if (claim.status !== ClaimStatus.FINANCE_REVIEW) { res.status(409).json({ error: "Claim is not awaiting finance review." }); return; }
    const status = action === "approve" || action === "override" ? ClaimStatus.APPROVED : action === "reject" ? ClaimStatus.REJECTED : ClaimStatus.RETURNED;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.expenseClaim.update({ where: { id: claim.id }, data: { status } });
      await tx.approvalHistory.create({ data: { claimId: claim.id, actorId: req.auth!.userId, stage: ApprovalStage.FINANCE, action: action.toUpperCase(), comment: input.comment } });
      return result;
    });
    await notifyUser(claim.employeeId, `Finance ${pastTense[action]} your claim`, `${claim.title}: ${input.comment ?? "No comment provided."}`);
    await writeAudit({ userId: req.auth!.userId, action: `FINANCE_${action.toUpperCase()}`, entity: "ExpenseClaim", entityId: claim.id, oldValue: { status: claim.status }, newValue: { status, reason: input.comment }, ipAddress: req.ip });
    res.json(updated);
  } catch (error) { next(error); }
});

workflowRouter.post("/:id/payment", requireRoles(Role.FINANCE), async (req, res, next) => {
  try {
    const input = z.object({ paymentDate: z.string().date(), referenceNumber: z.string().trim().min(1).max(160), amount: z.number().positive().finite() }).parse(req.body);
    const claim = await claimForAction(req.params.id);
    if (!claim) { res.status(404).json({ error: "Expense claim not found." }); return; }
    if (claim.status !== ClaimStatus.APPROVED) { res.status(409).json({ error: "Only approved claims can be marked paid." }); return; }
    if (Number(claim.totalAmount) !== input.amount) { res.status(400).json({ error: "Payment amount must equal the approved claim amount." }); return; }
    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({ data: { claimId: claim.id, paymentDate: new Date(`${input.paymentDate}T00:00:00.000Z`), referenceNumber: input.referenceNumber, amount: input.amount, recordedBy: req.auth!.userId } });
      await tx.expenseClaim.update({ where: { id: claim.id }, data: { status: ClaimStatus.PAID } });
      return created;
    });
    await notifyUser(claim.employeeId, "Reimbursement paid", `${claim.title} was paid. Reference: ${payment.referenceNumber}.`);
    await writeAudit({ userId: req.auth!.userId, action: "RECORD_PAYMENT", entity: "Payment", entityId: payment.id, newValue: { claimId: claim.id, amount: input.amount, referenceNumber: input.referenceNumber }, ipAddress: req.ip });
    res.status(201).json(payment);
  } catch (error) { next(error); }
});
