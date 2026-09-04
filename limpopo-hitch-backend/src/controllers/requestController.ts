import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();

function serializeRequest(req: any) {
  return {
    ...req,
    createdAt: Number(req.createdAt),
  };
}

export async function getMyRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;

    const requests = await prisma.rideRequest.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        post: true,
        fromUser: { select: { id: true, name: true, phone: true, avatar: true } },
        toUser: { select: { id: true, name: true, phone: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(requests.map(serializeRequest));
  } catch (err) {
    next(err);
  }
}

export async function createRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const fromUserId = req.userId!;
    const { postId, pickupPoint } = req.body;

    if (!postId) return res.status(400).json({ error: "postId is required" });

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.authorId === fromUserId) {
      return res.status(400).json({ error: "Cannot request your own post" });
    }

    const request = await prisma.rideRequest.create({
      data: {
        postId,
        fromUserId,
        toUserId: post.authorId,
        status: "pending",
        pickupPoint: pickupPoint || null,
        createdAt: BigInt(Date.now()),
      },
    });

    return res.status(201).json(serializeRequest(request));
  } catch (err) {
    next(err);
  }
}

export async function updateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const id = String(req.params.id);
    const { status, pickupPoint } = req.body;

    const request = await prisma.rideRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (request.fromUserId !== userId && request.toUserId !== userId && !req.isAdmin) {
      return res.status(403).json({ error: "Not authorized to update this request" });
    }

    const updated = await prisma.rideRequest.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(pickupPoint !== undefined && { pickupPoint }),
      },
    });

    if (status === "completed") {
      await prisma.user.update({
        where: { id: request.toUserId },
        data: { completedRides: { increment: 1 } },
      });
      await prisma.user.update({
        where: { id: request.fromUserId },
        data: { completedRides: { increment: 1 } },
      });
    }

    return res.json(serializeRequest(updated));
  } catch (err) {
    next(err);
  }
}
