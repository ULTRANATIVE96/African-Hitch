import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();

function serializeReview(r: any) {
  return {
    ...r,
    createdAt: Number(r.createdAt),
  };
}

export async function getDriverReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const targetId = req.query.driverId || req.query.userId;

    const whereClause: any = {};
    if (targetId) whereClause.driverId = String(targetId);

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(reviews.map(serializeReview));
  } catch (err) {
    next(err);
  }
}

export async function getUserReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = String(req.params.userId || req.query.userId || req.query.driverId || req.userId);

    const reviews = await prisma.review.findMany({
      where: { driverId: userId },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(reviews.map(serializeReview));
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authorId = req.userId!;
    const { driverId, rating, comment, postId } = req.body;
    const targetUserId = driverId;

    if (!targetUserId || rating === undefined) {
      return res.status(400).json({ error: "driverId (target user) and rating are required" });
    }

    if (authorId === targetUserId) {
      return res.status(400).json({ error: "You cannot review yourself" });
    }

    // Verify there is an accepted and completed ride request between author and target user
    const completedRide = await prisma.rideRequest.findFirst({
      where: {
        status: "completed",
        OR: [
          { fromUserId: authorId, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: authorId },
        ],
        ...(postId ? { postId } : {}),
      },
    });

    if (!completedRide) {
      return res.status(403).json({
        error: "You can only review someone after completing a ride together.",
      });
    }

    const effectivePostId = completedRide.postId || postId || null;

    // Check if author already reviewed target user for this ride
    const existingReview = await prisma.review.findFirst({
      where: {
        authorId,
        driverId: targetUserId,
        ...(effectivePostId ? { postId: effectivePostId } : {}),
      },
    });

    if (existingReview) {
      return res.status(409).json({
        error: "You have already reviewed this person for this ride.",
      });
    }

    const review = await prisma.review.create({
      data: {
        driverId: targetUserId,
        authorId,
        postId: effectivePostId,
        rating: Math.min(5, Math.max(1, parseFloat(rating))),
        comment: comment || "",
        createdAt: BigInt(Date.now()),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Recalculate target user average rating
    const allReviews = await prisma.review.findMany({
      where: { driverId: targetUserId },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const avgRating =
        allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;
      
      await prisma.user.update({
        where: { id: targetUserId },
        data: { rating: Math.round(avgRating * 10) / 10 },
      });
    }

    return res.status(201).json(serializeReview(review));
  } catch (err) {
    next(err);
  }
}
