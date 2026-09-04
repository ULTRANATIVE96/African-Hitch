import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { addFlagAndCheckBan } from "../services/flagService.js";

const prisma = new PrismaClient();

function serializeFlag(flag: any) {
  return {
    ...flag,
    createdAt: Number(flag.createdAt),
  };
}

export async function getFlags(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const flags = await prisma.flag.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(flags.map(serializeFlag));
  } catch (err) {
    next(err);
  }
}

export async function createFlag(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const reporterId = req.userId!;
    const reporter = await prisma.user.findUnique({ where: { id: reporterId } });
    if (!reporter) return res.status(404).json({ error: "Reporter not found" });

    const { flaggedUserId, reporterRole, reason, detail } = req.body;

    if (!flaggedUserId || !reason) {
      return res.status(400).json({ error: "flaggedUserId and reason are required" });
    }

    const roleEnum = reporterRole === "driver" ? "driver" : reporter.role;

    const flag = await addFlagAndCheckBan(
      flaggedUserId,
      reporterId,
      roleEnum,
      reason,
      detail || ""
    );

    return res.status(201).json(serializeFlag(flag));
  } catch (err) {
    next(err);
  }
}
