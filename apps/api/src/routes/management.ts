import { ClaimStatus, type Prisma, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { writeAudit } from "../services/audit.js";

export const managementRouter = Router();
managementRouter.use(authenticate);

const policySchema = z.object({
  name: z.string().trim().min(2).max(160), ruleType: z.string().trim().min(2).max(80),
  scope: z.enum(["COMPANY", "DEPARTMENT", "EMPLOYEE_LEVEL"]), departmentId: z.string().uuid().nullable().optional(),
  employeeLevel: z.string().trim().max(80).nullable().optional(), parameters: z.record(z.string(), z.unknown()),
  active: z.boolean().default(true), effectiveFrom: z.string().datetime().optional()
}).superRefine((input, ctx) => {
  if (input.scope === "DEPARTMENT" && !input.departmentId) ctx.addIssue({ code: "custom", path: ["departmentId"], message: "Department policies need a departmentId." });
  if (input.scope === "EMPLOYEE_LEVEL" && !input.employeeLevel) ctx.addIssue({ code: "custom", path: ["employeeLevel"], message: "Employee-level policies need an employeeLevel." });
});
const departmentSchema = z.object({ name: z.string().trim().min(2).max(120), costCenter: z.string().trim().max(80).nullable().optional(), parentId: z.string().uuid().nullable().optional() });

managementRouter.get("/policies", requireRoles(Role.ADMIN), async (_req, res, next) => {
  try { res.json(await prisma.policy.findMany({ include: { department: true }, orderBy: { createdAt: "desc" } })); } catch (error) { next(error); }
});
managementRouter.post("/policies", requireRoles(Role.ADMIN), async (req, res, next) => {
  try {
    const input = policySchema.parse(req.body);
    const policy = await prisma.policy.create({ data: { ...input, parameters: input.parameters as Prisma.InputJsonValue, effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined } });
    await writeAudit({ userId: req.auth!.userId, action: "CREATE_POLICY", entity: "Policy", entityId: policy.id, newValue: { name: policy.name, scope: policy.scope }, ipAddress: req.ip });
    res.status(201).json(policy);
  } catch (error) { next(error); }
});
managementRouter.put("/policies/:id", requireRoles(Role.ADMIN), async (req, res, next) => {
  try {
    const input = policySchema.parse(req.body);
    const previous = await prisma.policy.findUnique({ where: { id: req.params.id } });
    if (!previous) { res.status(404).json({ error: "Policy not found." }); return; }
    const policy = await prisma.policy.update({ where: { id: previous.id }, data: { ...input, parameters: input.parameters as Prisma.InputJsonValue, effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined } });
    await writeAudit({ userId: req.auth!.userId, action: "UPDATE_POLICY", entity: "Policy", entityId: policy.id, oldValue: { active: previous.active }, newValue: { active: policy.active }, ipAddress: req.ip });
    res.json(policy);
  } catch (error) { next(error); }
});
managementRouter.delete("/policies/:id", requireRoles(Role.ADMIN), async (req, res, next) => {
  try {
    const policy = await prisma.policy.findUnique({ where: { id: req.params.id } });
    if (!policy) { res.status(404).json({ error: "Policy not found." }); return; }
    await prisma.policy.delete({ where: { id: policy.id } });
    await writeAudit({ userId: req.auth!.userId, action: "DELETE_POLICY", entity: "Policy", entityId: policy.id, oldValue: { name: policy.name }, ipAddress: req.ip });
    res.status(204).end();
  } catch (error) { next(error); }
});

managementRouter.get("/departments", requireRoles(Role.ADMIN), async (_req, res, next) => {
  try { res.json(await prisma.department.findMany({ include: { parent: true, _count: { select: { users: true, claims: true } } }, orderBy: { name: "asc" } })); } catch (error) { next(error); }
});
managementRouter.post("/departments", requireRoles(Role.ADMIN), async (req, res, next) => {
  try {
    const department = await prisma.department.create({ data: departmentSchema.parse(req.body) });
    await writeAudit({ userId: req.auth!.userId, action: "CREATE_DEPARTMENT", entity: "Department", entityId: department.id, newValue: { name: department.name }, ipAddress: req.ip });
    res.status(201).json(department);
  } catch (error) { next(error); }
});
managementRouter.put("/departments/:id", requireRoles(Role.ADMIN), async (req, res, next) => {
  try {
    const previous = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!previous) { res.status(404).json({ error: "Department not found." }); return; }
    const department = await prisma.department.update({ where: { id: previous.id }, data: departmentSchema.parse(req.body) });
    await writeAudit({ userId: req.auth!.userId, action: "UPDATE_DEPARTMENT", entity: "Department", entityId: department.id, oldValue: { name: previous.name }, newValue: { name: department.name }, ipAddress: req.ip });
    res.json(department);
  } catch (error) { next(error); }
});
managementRouter.delete("/departments/:id", requireRoles(Role.ADMIN), async (req, res, next) => {
  try {
    const department = await prisma.department.findUnique({ where: { id: req.params.id }, include: { _count: { select: { users: true, claims: true, children: true } } } });
    if (!department) { res.status(404).json({ error: "Department not found." }); return; }
    if (department._count.users || department._count.claims || department._count.children) { res.status(409).json({ error: "Move users, claims, and child departments before deleting this department." }); return; }
    await prisma.department.delete({ where: { id: department.id } });
    await writeAudit({ userId: req.auth!.userId, action: "DELETE_DEPARTMENT", entity: "Department", entityId: department.id, oldValue: { name: department.name }, ipAddress: req.ip });
    res.status(204).end();
  } catch (error) { next(error); }
});

managementRouter.get("/notifications", async (req, res, next) => {
  try { res.json(await prisma.notification.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: "desc" }, take: 100 })); } catch (error) { next(error); }
});
managementRouter.put("/notifications/read", async (req, res, next) => {
  try {
    const input = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }).parse(req.body);
    const result = await prisma.notification.updateMany({ where: { id: { in: input.ids }, userId: req.auth!.userId, readAt: null }, data: { readAt: new Date() } });
    res.json({ updated: result.count });
  } catch (error) { next(error); }
});

managementRouter.get("/audit-logs", requireRoles(Role.FINANCE, Role.ADMIN), async (req, res, next) => {
  try {
    const limit = z.coerce.number().int().min(1).max(200).default(100).parse(req.query.limit);
    res.json(await prisma.auditLog.findMany({ include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: limit }));
  } catch (error) { next(error); }
});

managementRouter.get("/dashboard", async (req, res, next) => {
  try {
    const roles = req.auth!.roles;
    const employeeId = req.auth!.userId;
    const claimWhere = roles.includes(Role.ADMIN) || roles.includes(Role.FINANCE) ? {} : roles.includes(Role.MANAGER) ? { OR: [{ employeeId }, { employee: { managerId: employeeId } }] } : { employeeId };
    const [byStatus, recentClaims, unreadNotifications] = await Promise.all([
      prisma.expenseClaim.groupBy({ by: ["status"], where: claimWhere, _count: { _all: true }, _sum: { totalAmount: true } }),
      prisma.expenseClaim.findMany({ where: claimWhere, include: { employee: { select: { name: true } } }, orderBy: { updatedAt: "desc" }, take: 8 }),
      prisma.notification.count({ where: { userId: employeeId, readAt: null } })
    ]);
    const queue = roles.includes(Role.MANAGER) ? await prisma.expenseClaim.count({ where: { status: ClaimStatus.MANAGER_REVIEW, employee: { managerId: employeeId } } }) : roles.includes(Role.FINANCE) ? await prisma.expenseClaim.count({ where: { status: ClaimStatus.FINANCE_REVIEW } }) : 0;
    res.json({ byStatus, recentClaims, unreadNotifications, queue });
  } catch (error) { next(error); }
});
