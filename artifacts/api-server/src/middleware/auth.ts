import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUserById, type UserDocument } from "@workspace/db";

function resolveJwtSecret(): string {
  const secret =
    process.env.JWT_SECRET?.trim() || process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return "dev-only-insecure-secret-change-me";
}

export const JWT_SECRET = resolveJwtSecret();

export interface TokenPayload {
  id: string;
  email: string;
  role: "user" | "admin";
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
  currentUser?: UserDocument;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

async function attachCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
  const user = await findUserById(req.user!.id);
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "User no longer exists" });
    return;
  }

  req.currentUser = user;
  next();
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    void attachCurrentUser(req, res, next);
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }
}

export function verifiedUserMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (req.currentUser?.role !== "user") {
      res.status(403).json({ error: "Forbidden", message: "User access required" });
      return;
    }

    if (!req.currentUser.isVerified) {
      res.status(403).json({ error: "Forbidden", message: "Email verification required" });
      return;
    }

    next();
  });
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (req.currentUser?.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Admin access required" });
      return;
    }

    next();
  });
}

