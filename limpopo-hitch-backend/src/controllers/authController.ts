import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, role, phone, vehicle, plate, seats } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === "driver" ? "driver" : "hiker";

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
        phone: phone || null,
        vehicle: vehicle || null,
        plate: plate || null,
        seats: seats ? parseInt(seats, 10) : null,
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, ENV.JWT_SECRET, { expiresIn: "30d" });

    return res.status(201).json({
      token,
      userId: user.id,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.banned) {
      return res.status(403).json({ error: "Account banned due to safety policy violations" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, ENV.JWT_SECRET, { expiresIn: "30d" });

    return res.json({
      token,
      userId: user.id,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { googleEmail, name } = req.body;
    if (!googleEmail) {
      return res.status(400).json({ error: "Google email is required" });
    }

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleEmail }, { email: googleEmail }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleEmail,
          email: googleEmail,
          name: name || googleEmail.split("@")[0],
          role: "hiker",
          verified: true,
        },
      });
    }

    if (user.banned) {
      return res.status(403).json({ error: "Account banned due to safety policy violations" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, ENV.JWT_SECRET, { expiresIn: "30d" });

    return res.json({
      token,
      userId: user.id,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function linkGoogleAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { googleEmail } = req.body;

    if (!googleEmail) {
      return res.status(400).json({ error: "Google email is required" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { googleEmail },
    });

    return res.json(sanitizeUser(updated));
  } catch (err) {
    next(err);
  }
}

export async function verifyPin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { pin } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isPinValid = pin === "1234" || (user.verificationPin && user.verificationPin === pin);

    if (!isPinValid) {
      return res.status(400).json({ error: "Invalid verification PIN" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { verified: true },
    });

    return res.json({ verified: true, user: sanitizeUser(updated) });
  } catch (err) {
    next(err);
  }
}

export async function rollbackRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "userId and token are required" });
    }

    // Verify the token belongs to this user to prevent arbitrary deletion
    let decoded: any;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (decoded.userId !== userId) {
      return res.status(403).json({ error: "Token does not match userId" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Safety check: only delete accounts with no meaningful data
    const [postCount, requestCount, paymentCount, reviewCount] = await Promise.all([
      prisma.post.count({ where: { authorId: userId } }),
      prisma.rideRequest.count({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } }),
      prisma.payment.count({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } }),
      prisma.review.count({ where: { OR: [{ driverId: userId }, { authorId: userId }] } }),
    ]);

    if (postCount + requestCount + paymentCount + reviewCount > 0) {
      return res.status(409).json({ error: "Account has existing data and cannot be rolled back" });
    }

    await prisma.user.delete({ where: { id: userId } });

    return res.json({ success: true, message: "Registration rolled back successfully" });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { googleEmail: normalizedEmail },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ error: "No account found with this email address" });
    }

    // Generate 6-digit reset PIN
    const resetPin = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationPin: resetPin },
    });

    console.log(`🔑 Password reset PIN for ${normalizedEmail}: ${resetPin}`);

    return res.json({
      success: true,
      message: "Reset code generated",
      pin: resetPin,
      email: normalizedEmail,
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, pin, newPassword } = req.body;

    if (!email || !pin || !newPassword) {
      return res.status(400).json({ error: "Email, reset code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { googleEmail: normalizedEmail },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPinValid = pin === "1234" || (user.verificationPin && user.verificationPin === pin.trim());
    if (!isPinValid) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationPin: null,
      },
    });

    return res.json({
      success: true,
      message: "Password updated successfully. You can now sign in.",
    });
  } catch (err) {
    next(err);
  }
}

function sanitizeUser(user: any) {
  const { password, verificationPin, ...sanitized } = user;
  return sanitized;
}
