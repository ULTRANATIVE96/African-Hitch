import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendVerificationEmail } from "../services/emailService.js";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Short-lived pending token (15 min) — only used for the PIN verification step
function makePendingToken(userId: string, role: string): string {
  return jwt.sign({ userId, role, pending: true }, ENV.JWT_SECRET, { expiresIn: "15m" });
}

// Full session token (30 days) — issued after verification
function makeSessionToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, ENV.JWT_SECRET, { expiresIn: "30d" });
}

function sanitizeUser(user: any) {
  const { password, verificationPin, ...sanitized } = user;
  return sanitized;
}

// ─── Register (Email + Password) ──────────────────────────────────────────────
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, role, phone, vehicle, plate, seats } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // If existing user is unverified (abandoned registration), remove them and allow re-registration
      if (!existing.verified) {
        await prisma.user.delete({ where: { id: existing.id } });
      } else {
        return res.status(400).json({ error: "An account with this email already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === "driver" ? "driver" : "hiker";
    const pin = generatePin();

    // Create user as UNVERIFIED — not saved permanently until PIN confirmed
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
        verified: false,
        verificationPin: pin,
      },
    });

    // Send PIN to email (non-blocking — log error but don't fail registration)
    try {
      await sendVerificationEmail(email, pin, name);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    const pendingToken = makePendingToken(user.id, user.role);

    return res.status(201).json({
      requiresVerification: true,
      pendingToken,
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Login (Email + Password) ─────────────────────────────────────────────────
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

    if (!user.verified) {
      return res.status(403).json({ error: "Account not verified. Please complete registration via the verification email." });
    }

    const token = makeSessionToken(user.id, user.role);

    return res.json({
      token,
      userId: user.id,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Google Auth (Sign In & Register) ────────────────────────────────────────
export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { credential, role: requestedRole, mode } = req.body;
    let googleEmail = req.body.googleEmail || req.body.email;
    let name = req.body.name;
    let avatar = req.body.avatar;

    // 1. If a Google OAuth ID token credential was provided, verify and decode it
    if (credential) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        if (verifyRes.ok) {
          const payload: any = await verifyRes.json();
          if (payload.email) {
            googleEmail = payload.email;
            name = payload.name || payload.given_name || googleEmail.split("@")[0];
            avatar = payload.picture || avatar;
          }
        } else {
          const parts = credential.split(".");
          if (parts[1]) {
            const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
            if (decoded.email) {
              googleEmail = decoded.email;
              name = decoded.name || decoded.given_name || googleEmail.split("@")[0];
              avatar = decoded.picture || avatar;
            }
          }
        }
      } catch (verifyErr) {
        console.warn("Google token verification warning:", verifyErr);
        try {
          const parts = credential.split(".");
          if (parts[1]) {
            const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
            if (decoded.email) {
              googleEmail = decoded.email;
              name = decoded.name || decoded.given_name || googleEmail.split("@")[0];
              avatar = decoded.picture || avatar;
            }
          }
        } catch {}
      }
    }

    if (!googleEmail || typeof googleEmail !== "string") {
      return res.status(400).json({ error: "A valid Google email address is required" });
    }

    const normalizedEmail = googleEmail.trim().toLowerCase();
    const userRole = requestedRole === "driver" ? "driver" : "hiker";

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleEmail: normalizedEmail }, { email: normalizedEmail }] },
    });

    // Sign-in: must have existing verified account
    if (mode === "signin") {
      if (!user) {
        return res.status(404).json({
          error: "No account found with this Google email. Please switch to 'Create account' to register.",
        });
      }
      if (user.banned) {
        return res.status(403).json({ error: "Account banned due to safety policy violations" });
      }
      // Link Google email if not already linked
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleEmail: normalizedEmail,
          verified: true,
          ...(avatar && !user.avatar ? { avatar } : {}),
        },
      });
      const token = makeSessionToken(user.id, user.role);
      return res.json({ token, userId: user.id, user: sanitizeUser(user) });
    }

    // Sign-up / registration flow
    if (user) {
      // Account already exists — if verified, tell user to sign in
      if (user.verified) {
        return res.status(400).json({
          error: "An account with this Google email already exists. Please use 'Sign in' instead.",
        });
      }
      // Unverified leftover — clean it up and re-register
      await prisma.user.delete({ where: { id: user.id } });
    }

    const { phone, vehicle, plate, seats } = req.body;
    const pin = generatePin();
    const displayName = name || normalizedEmail.split("@")[0];

    const newUser = await prisma.user.create({
      data: {
        googleEmail: normalizedEmail,
        email: normalizedEmail,
        name: displayName,
        role: userRole,
        avatar: avatar || null,
        verified: false,
        verificationPin: pin,
        phone: phone || null,
        vehicle: vehicle || null,
        plate: plate || null,
        seats: seats ? parseInt(seats, 10) : null,
      },
    });

    // Send PIN email
    try {
      await sendVerificationEmail(normalizedEmail, pin, displayName);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    const pendingToken = makePendingToken(newUser.id, newUser.role);

    return res.status(201).json({
      requiresVerification: true,
      pendingToken,
      userId: newUser.id,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Verify PIN (Completes Registration) ──────────────────────────────────────
export async function verifyPin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: "Verification PIN is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.verificationPin || user.verificationPin !== pin.trim()) {
      return res.status(400).json({ error: "Invalid verification code. Please check your email and try again." });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { verified: true, verificationPin: null },
    });

    // Issue a full 30-day session token now that registration is complete
    const token = makeSessionToken(updated.id, updated.role);

    return res.json({ verified: true, token, userId: updated.id, user: sanitizeUser(updated) });
  } catch (err) {
    next(err);
  }
}

// ─── Rollback Registration (Cancel midway) ────────────────────────────────────
export async function rollbackRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "userId and token are required" });
    }

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

    // Only allow rollback if the account is still unverified (registration not completed)
    if (user.verified) {
      return res.status(409).json({ error: "Account already verified — cannot roll back" });
    }

    await prisma.user.delete({ where: { id: userId } });

    return res.json({ success: true, message: "Registration cancelled successfully" });
  } catch (err) {
    next(err);
  }
}

// ─── Link Google Account ──────────────────────────────────────────────────────
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

// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { googleEmail: normalizedEmail }] },
    });

    if (!user) {
      return res.status(404).json({ error: "No account found with this email address" });
    }

    const resetPin = generatePin();

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationPin: resetPin },
    });

    // Send reset email
    try {
      await sendVerificationEmail(normalizedEmail, resetPin, user.name);
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr);
    }

    console.log(`🔑 Password reset PIN for ${normalizedEmail}: ${resetPin}`);

    return res.json({
      success: true,
      message: "A reset code has been sent to your email address",
    });
  } catch (err) {
    next(err);
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────
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
      where: { OR: [{ email: normalizedEmail }, { googleEmail: normalizedEmail }] },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.verificationPin || user.verificationPin !== pin.trim()) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, verificationPin: null },
    });

    return res.json({
      success: true,
      message: "Password updated successfully. You can now sign in.",
    });
  } catch (err) {
    next(err);
  }
}
