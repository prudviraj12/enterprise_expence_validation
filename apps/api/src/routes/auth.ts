import { createHash, randomUUID } from "node:crypto";
import { Router } from "express";
import { Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config, isProduction } from "../config.js";
import { prisma } from "../db.js";
import { authenticate, requireRoles, signAccessToken } from "../middleware/auth.js";
import { writeAudit } from "../services/audit.js";

export const authRouter = Router();
const refreshCookie = "expense_refresh";
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  departmentId: true,
  roles: { select: { role: true } }
} as const;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function setRefreshCookie(res: Parameters<Parameters<typeof authRouter.post>[1]>[1], token: string): void {
  res.cookie(refreshCookie, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/refresh",
    maxAge: config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  });
}

async function createSession(userId: string, roles: Role[]): Promise<string> {
  const tokenId = randomUUID();
  const token = jwt.sign({ typ: "refresh", jti: tokenId }, config.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: `${config.REFRESH_TOKEN_TTL_DAYS}d`
  });
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
    }
  });
  return token;
}

const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(72)
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);
    if (Buffer.byteLength(input.password, "utf8") > 72) {
      res.status(400).json({ error: "Password must be no more than 72 bytes." });
      return;
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        roles: { create: [{ role: Role.EMPLOYEE }] }
      },
      select: publicUserSelect
    });
    await writeAudit({ action: "REGISTER", entity: "User", entityId: user.id, userId: user.id, ipAddress: req.ip });
    const roles = user.roles.map((entry) => entry.role);
    const refreshToken = await createSession(user.id, roles);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken: signAccessToken(user.id, roles), user: { ...user, roles } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().min(1).max(72) }).parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { roles: true }
    });
    if (!user || user.status !== UserStatus.ACTIVE || !(await bcrypt.compare(input.password, user.passwordHash))) {
      res.status(401).json({ error: "Email or password is incorrect." });
      return;
    }

    const roles = user.roles.map((entry) => entry.role);
    const refreshToken = await createSession(user.id, roles);
    setRefreshCookie(res, refreshToken);
    await writeAudit({ action: "LOGIN", entity: "User", entityId: user.id, userId: user.id, ipAddress: req.ip });
    res.json({
      accessToken: signAccessToken(user.id, roles),
      user: { id: user.id, name: user.name, email: user.email, departmentId: user.departmentId, roles }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.[refreshCookie] as string | undefined;
    if (!token) {
      res.status(401).json({ error: "Refresh token required." });
      return;
    }

    let claims: { sub: string; jti: string; typ: string };
    try {
      claims = jwt.verify(token, config.JWT_REFRESH_SECRET) as typeof claims;
    } catch {
      res.clearCookie(refreshCookie, { path: "/refresh", sameSite: "strict", secure: isProduction });
      res.status(401).json({ error: "Invalid or expired refresh token." });
      return;
    }

    if (claims.typ !== "refresh" || !claims.sub || !claims.jti) {
      res.status(401).json({ error: "Invalid refresh token." });
      return;
    }
    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
      if (stored?.revokedAt) await prisma.refreshToken.updateMany({ where: { userId: claims.sub, revokedAt: null }, data: { revokedAt: new Date() } });
      res.clearCookie(refreshCookie, { path: "/refresh", sameSite: "strict", secure: isProduction });
      res.status(401).json({ error: "Refresh token has been revoked or expired." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: claims.sub }, include: { roles: true } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      res.status(401).json({ error: "Account is unavailable." });
      return;
    }
    const roles = user.roles.map((entry) => entry.role);
    const nextToken = await createSession(user.id, roles);
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    setRefreshCookie(res, nextToken);
    res.json({ accessToken: signAccessToken(user.id, roles) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[refreshCookie] as string | undefined;
    if (token) {
      await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
    }
    res.clearCookie(refreshCookie, { path: "/refresh", sameSite: "strict", secure: isProduction });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId }, select: publicUserSelect });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({ ...user, roles: user.roles.map((entry) => entry.role) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/users", authenticate, requireRoles(Role.ADMIN), async (req, res, next) => {
  try {
    const input = z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
      password: z.string().min(12).max(72),
      departmentId: z.string().uuid().optional(),
      managerId: z.string().uuid().optional(),
      roles: z.array(z.nativeEnum(Role)).min(1)
    }).parse(req.body);
    if (Buffer.byteLength(input.password, "utf8") > 72) {
      res.status(400).json({ error: "Password must be no more than 72 bytes." });
      return;
    }
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 12),
        departmentId: input.departmentId,
        managerId: input.managerId,
        roles: { create: [...new Set(input.roles)].map((role) => ({ role })) }
      },
      select: publicUserSelect
    });
    await writeAudit({ action: "CREATE_USER", entity: "User", entityId: user.id, userId: req.auth!.userId, ipAddress: req.ip });
    res.status(201).json({ ...user, roles: user.roles.map((entry) => entry.role) });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/users", authenticate, requireRoles(Role.ADMIN), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: "desc" }
    });
    res.json(users.map((user) => ({ ...user, roles: user.roles.map((entry) => entry.role) })));
  } catch (error) {
    next(error);
  }
});

authRouter.patch("/users/:id", authenticate, requireRoles(Role.ADMIN), async (req, res, next) => {
  try {
    const input = z.object({
      name: z.string().trim().min(2).max(120).optional(),
      departmentId: z.string().uuid().nullable().optional(),
      managerId: z.string().uuid().nullable().optional(),
      employeeLevel: z.string().trim().max(80).nullable().optional(),
      status: z.nativeEnum(UserStatus).optional(),
      roles: z.array(z.nativeEnum(Role)).min(1).optional()
    }).parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id: req.params.id }, include: { roles: true } });
    if (!existing) { res.status(404).json({ error: "User not found." }); return; }
    if (existing.id === req.auth!.userId && input.status === UserStatus.DISABLED) { res.status(409).json({ error: "You cannot disable your own account." }); return; }
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...input,
        roles: input.roles ? { deleteMany: {}, create: [...new Set(input.roles)].map((role) => ({ role })) } : undefined
      },
      select: publicUserSelect
    });
    if (input.status === UserStatus.DISABLED) await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await writeAudit({ userId: req.auth!.userId, action: "UPDATE_USER", entity: "User", entityId: user.id, oldValue: { status: existing.status, roles: existing.roles.map((entry) => entry.role) }, newValue: { status: user.status, roles: user.roles.map((entry) => entry.role) }, ipAddress: req.ip });
    res.json({ ...user, roles: user.roles.map((entry) => entry.role) });
  } catch (error) {
    next(error);
  }
});
