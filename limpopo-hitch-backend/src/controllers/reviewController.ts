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
    const { driverId } = req.query;

    const whereClause: any = {};
    if (driverId) whereClause.driverId = String(driverId);

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

export async function createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authorId = req.userId!;
    const { driverId, rating, comment } = req.body;

    if (!driverId || rating === undefined) {
      return res.status(400).json({ error: "driverId and rating are required" });
    }

    const review = await prisma.review.create({
      data: {
        driverId,
        authorId,
        rating: parseFloat(rating),
        comment: comment || "",
        createdAt: BigInt(Date.now()),
      },
    });

    // Recalculate driver average rating
    const allDriverReviews = await prisma.review.findMany({
      where: { driverId },
      select: { rating: true },
    });

    if (allDriverReviews.length > 0) {
      const avgRating =
        allDriverReviews.reduce((acc, curr) => acc + curr.rating, 0) / allDriverReviews.length;
      
      await prisma.user.update({
        where: { id: driverId },
        data: { rating: Math.round(avgRating * 10) / 10 },
      });
    }

    return res.status(201).json(serializeReview(review));
  } catch (err) {
    next(err);
  }
}
