import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  isAdmin?: boolean;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string; role?: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    return next();
  } catch (err) {
    // Try checking if it's an admin token
    try {
      const adminDecoded = jwt.verify(token, ENV.ADMIN_JWT_SECRET) as { role: string };
      if (adminDecoded.role === "ADMIN") {
        req.isAdmin = true;
        return next();
      }
    } catch {}

    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Admin token required" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, ENV.ADMIN_JWT_SECRET) as { role: string };
    if (decoded.role === "ADMIN") {
      req.isAdmin = true;
      return next();
    }
    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid admin token" });
  }
}
