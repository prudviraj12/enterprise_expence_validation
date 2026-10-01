import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

type AccessClaims = { sub: string; roles: Role[]; typ: "access" };

export function signAccessToken(userId: string, roles: Role[]): string {
  return jwt.sign({ roles, typ: "access" }, config.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: config.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const claims = jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessClaims;
    if (claims.typ !== "access" || !claims.sub || !Array.isArray(claims.roles)) {
      res.status(401).json({ error: "Invalid access token." });
      return;
    }
    req.auth = { userId: claims.sub, roles: claims.roles };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token." });
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.some((role) => req.auth?.roles.includes(role))) {
      res.status(403).json({ error: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
}