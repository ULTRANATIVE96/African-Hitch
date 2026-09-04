import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { unbanAndClearFlags } from "../services/flagService.js";

const prisma = new PrismaClient();

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    if (username === ENV.ADMIN_USERNAME && password === ENV.ADMIN_PASSWORD) {
      const token = jwt.sign({ role: "ADMIN" }, ENV.ADMIN_JWT_SECRET, { expiresIn: "7d" });
      return res.json({ token });
    }

    return res.status(401).json({ error: "Invalid admin credentials" });
  } catch (err) {
    next(err);
  }
}

export async function getAllUsersAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function unbanUserAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await unbanAndClearFlags(id);
    return res.json({ unbanned: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteUserAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await prisma.user.delete({ where: { id } });
    await prisma.flag.deleteMany({ where: { flaggedUserId: id } });
    return res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function getAllFlagsAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const flags = await prisma.flag.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(flags.map((f) => ({ ...f, createdAt: Number(f.createdAt) })));
  } catch (err) {
    next(err);
  }
}

export async function removeFlagAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await prisma.flag.delete({ where: { id } });
    return res.json({ removed: true });
  } catch (err) {
    next(err);
  }
}

export async function getAllAppealsAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const appeals = await prisma.appeal.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(appeals.map((a) => ({ ...a, createdAt: Number(a.createdAt) })));
  } catch (err) {
    next(err);
  }
}

export async function resolveAppealAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { approved } = req.body;

    const appeal = await prisma.appeal.findUnique({ where: { id } });
    if (!appeal) return res.status(404).json({ error: "Appeal not found" });

    const status = approved ? "approved" : "rejected";
    const updated = await prisma.appeal.update({
      where: { id },
      data: { status },
    });

    if (approved && appeal.userId) {
      await unbanAndClearFlags(appeal.userId);
    }

    return res.json({ ...updated, createdAt: Number(updated.createdAt) });
  } catch (err) {
    next(err);
  }
}

export async function getStatsAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const totalUsers = await prisma.user.count();
    const bannedUsers = await prisma.user.count({ where: { banned: true } });
    const totalFlags = await prisma.flag.count();
    const pendingAppeals = await prisma.appeal.count({ where: { status: "pending" } });
    const openPosts = await prisma.post.count({ where: { open: true } });

    return res.json({
      totalUsers,
      bannedUsers,
      totalFlags,
      pendingAppeals,
      openPosts,
    });
  } catch (err) {
    next(err);
  }
}
