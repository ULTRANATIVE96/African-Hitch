import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function serializeAppeal(a: any) {
  return {
    ...a,
    createdAt: Number(a.createdAt),
  };
}

export async function submitAppeal(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, name, email, reason, flagIds } = req.body;

    if (!name || !email || !reason) {
      return res.status(400).json({ error: "Name, email, and reason are required" });
    }

    const appeal = await prisma.appeal.create({
      data: {
        userId: userId || null,
        name,
        email,
        reason,
        flagIds: Array.isArray(flagIds) ? flagIds.join(",") : (flagIds || null),
        status: "pending",
        createdAt: BigInt(Date.now()),
      },
    });

    return res.status(201).json(serializeAppeal(appeal));
  } catch (err) {
    next(err);
  }
}
