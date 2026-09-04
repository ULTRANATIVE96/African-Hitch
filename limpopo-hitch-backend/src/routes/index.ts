import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import * as authController from "../controllers/authController.js";
import * as userController from "../controllers/userController.js";
import * as postController from "../controllers/postController.js";
import * as requestController from "../controllers/requestController.js";
import * as flagController from "../controllers/flagController.js";
import * as paymentController from "../controllers/paymentController.js";
import * as reviewController from "../controllers/reviewController.js";
import * as appealController from "../controllers/appealController.js";
import * as adminController from "../controllers/adminController.js";

const router = Router();

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post("/auth/register", authRateLimiter, authController.register);
router.post("/auth/login", authRateLimiter, authController.login);
router.post("/auth/google", authRateLimiter, authController.googleLogin);
router.post("/auth/link-google", requireAuth, authController.linkGoogleAccount);
router.post("/auth/verify-pin", requireAuth, authRateLimiter, authController.verifyPin);
router.post("/auth/forgot-password", authRateLimiter, authController.forgotPassword);
router.post("/auth/reset-password", authRateLimiter, authController.resetPassword);
router.delete("/auth/rollback", authController.rollbackRegistration);

// ── Users ────────────────────────────────────────────────────────────────────
router.get("/users", requireAuth, userController.getAllUsers);
router.get("/users/me", requireAuth, userController.getMe);
router.get("/users/:id", requireAuth, userController.getUserById);
router.patch("/users/me", requireAuth, userController.updateMe);

// ── Posts ────────────────────────────────────────────────────────────────────
router.get("/posts", requireAuth, postController.getFeed);
router.get("/posts/mine", requireAuth, postController.getMyPosts);
router.get("/posts/:id", requireAuth, postController.getPostById);
router.post("/posts", requireAuth, postController.createPost);
router.patch("/posts/:id/close", requireAuth, postController.closePost);
router.delete("/posts/:id", requireAuth, postController.deletePost);

// Post Comments
router.post("/posts/:id/comments", requireAuth, postController.addComment);
router.delete("/posts/comments/:commentId", requireAuth, postController.deleteComment);

// ── Ride Requests ─────────────────────────────────────────────────────────────
router.get("/requests", requireAuth, requestController.getMyRequests);
router.post("/requests", requireAuth, requestController.createRequest);
router.patch("/requests/:id", requireAuth, requestController.updateRequest);

// ── Flags & Safety ───────────────────────────────────────────────────────────
router.get("/flags", requireAuth, flagController.getFlags);
router.post("/flags", requireAuth, flagController.createFlag);

// ── Payments ─────────────────────────────────────────────────────────────────
router.get("/payments", requireAuth, paymentController.getMyPayments);
router.post("/payments", requireAuth, paymentController.createPayment);

// ── Driver Reviews ───────────────────────────────────────────────────────────
router.get("/reviews", requireAuth, reviewController.getDriverReviews);
router.post("/reviews", requireAuth, reviewController.createReview);

// ── Appeals ──────────────────────────────────────────────────────────────────
router.post("/appeals", appealController.submitAppeal);

// ── Admin Panel ──────────────────────────────────────────────────────────────
router.post("/admin/login", authRateLimiter, adminController.adminLogin);
router.get("/admin/users", requireAdmin, adminController.getAllUsersAdmin);
router.patch("/admin/users/:id/unban", requireAdmin, adminController.unbanUserAdmin);
router.delete("/admin/users/:id", requireAdmin, adminController.deleteUserAdmin);

router.get("/admin/flags", requireAdmin, adminController.getAllFlagsAdmin);
router.delete("/admin/flags/:id", requireAdmin, adminController.removeFlagAdmin);

router.get("/admin/appeals", requireAdmin, adminController.getAllAppealsAdmin);
router.patch("/admin/appeals/:id", requireAdmin, adminController.resolveAppealAdmin);

router.get("/admin/stats", requireAdmin, adminController.getStatsAdmin);

export default router;
