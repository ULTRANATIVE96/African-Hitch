import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();

function serializePayment(p: any) {
  return {
    ...p,
    createdAt: Number(p.createdAt),
  };
}

export async function getMyPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;

    const payments = await prisma.payment.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(payments.map(serializePayment));
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const fromUserId = req.userId!;
    const { postId, toUserId, amount, route } = req.body;

    if (!postId || !toUserId || amount === undefined) {
      return res.status(400).json({ error: "postId, toUserId, and amount are required" });
    }

    const payment = await prisma.payment.create({
      data: {
        postId,
        fromUserId,
        toUserId,
        amount: parseFloat(amount),
        route: route || "Limpopo Ride Seat Booking",
        status: "completed",
        createdAt: BigInt(Date.now()),
      },
    });

    return res.status(201).json(serializePayment(payment));
  } catch (err) {
    next(err);
  }
}
