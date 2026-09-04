import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();

function serializePost(post: any) {
  return {
    ...post,
    createdAt: Number(post.createdAt),
  };
}

export async function getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { role } = req.query;

    const whereClause: any = { open: true };
    if (role === "hiker") whereClause.role = "hiker";
    if (role === "driver") whereClause.role = "driver";

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            rating: true,
            phone: true,
            verified: true,
          },
        },
      },
    });

    return res.json(posts.map(serializePost));
  } catch (err) {
    next(err);
  }
}

export async function getPostById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            rating: true,
            phone: true,
            vehicle: true,
            plate: true,
            verified: true,
          },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    return res.json({
      ...serializePost(post),
      comments: post.comments.map((c: any) => ({
        ...c,
        createdAt: Number(c.createdAt),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyPosts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(posts.map(serializePost));
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const {
      from,
      to,
      date,
      time,
      pricePerSeat,
      notes,
      passengers,
      luggage,
      specials,
      specialsFee,
      seats,
      carPhoto,
    } = req.body;

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        role: user.role,
        fromLocation: from || req.body.fromLocation,
        toLocation: to || req.body.toLocation,
        date,
        time: time || "06:00",
        pricePerSeat: parseFloat(pricePerSeat || 0),
        notes,
        passengers: passengers ? parseInt(passengers, 10) : null,
        luggage,
        specials,
        specialsFee: specialsFee ? parseFloat(specialsFee) : null,
        seats: seats ? parseInt(seats, 10) : null,
        carPhoto,
        open: true,
        createdAt: BigInt(Date.now()),
      },
    });

    return res.status(201).json(serializePost(post));
  } catch (err) {
    next(err);
  }
}

export async function closePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const id = String(req.params.id);
    const { reason } = req.body;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.authorId !== userId && !req.isAdmin) {
      return res.status(403).json({ error: "Not authorized to close this post" });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        open: false,
        closedReason: reason || "Closed by author",
      },
    });

    return res.json(serializePost(updated));
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const id = String(req.params.id);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.authorId !== userId && !req.isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await prisma.post.delete({ where: { id } });
    return res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const postId = String(req.params.id);
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: "Comment text required" });

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        text,
        createdAt: BigInt(Date.now()),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return res.status(201).json({
      ...comment,
      createdAt: Number(comment.createdAt),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const commentId = String(req.params.commentId);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.authorId !== userId && !req.isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}
