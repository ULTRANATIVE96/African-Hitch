import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();

export async function getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        rating: true,
        completedRides: true,
        email: true,
        googleEmail: true,
        linkedUserId: true,
        vehicle: true,
        plate: true,
        vehiclePhoto: true,
        seats: true,
        profilePhoto: true,
        banned: true,
        verified: true,
      },
    });

    return res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, verificationPin, ...sanitized } = user;
    return res.json(sanitized);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        rating: true,
        completedRides: true,
        vehicle: true,
        plate: true,
        vehiclePhoto: true,
        seats: true,
        profilePhoto: true,
        banned: true,
        verified: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const patch = req.body;

    const dataToUpdate: any = {};
    if (patch.name !== undefined) dataToUpdate.name = patch.name;
    if (patch.phone !== undefined) dataToUpdate.phone = patch.phone;
    if (patch.avatar !== undefined) dataToUpdate.avatar = patch.avatar;
    if (patch.profilePhoto !== undefined) dataToUpdate.profilePhoto = patch.profilePhoto;
    if (patch.vehicle !== undefined) dataToUpdate.vehicle = patch.vehicle;
    if (patch.plate !== undefined) dataToUpdate.plate = patch.plate;
    if (patch.vehiclePhoto !== undefined) dataToUpdate.vehiclePhoto = patch.vehiclePhoto;
    if (patch.seats !== undefined) dataToUpdate.seats = patch.seats ? parseInt(patch.seats, 10) : null;
    if (patch.role !== undefined) dataToUpdate.role = patch.role === "driver" ? "driver" : "hiker";

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    const { password, verificationPin, ...sanitized } = updated;
    return res.json(sanitized);
  } catch (err) {
    next(err);
  }
}
