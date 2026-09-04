import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { ENV } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { setupSocketHandlers } from "./socket/locationHandler.js";

const app = express();
const server = http.createServer(app);

// ── Security & Core Middleware ───────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: ENV.CORS_ORIGIN === "*" ? true : ENV.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// ── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ENV.CORS_ORIGIN === "*" ? true : ENV.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});
setupSocketHandlers(io);

// ── Health Check Endpoint ───────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Limpopo Hitch Connect Node.js API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use("/api", routes);

// ── Error Handling Middleware ────────────────────────────────────────────────
app.use(errorHandler);

// ── Server Listen ────────────────────────────────────────────────────────────
server.listen(ENV.PORT, () => {
  console.log(`🚀 Limpopo Hitch Node.js API running on http://localhost:${ENV.PORT}`);
  console.log(`📡 Socket.io server active for real-time trip location tracking`);
});

export { app, server, io };
