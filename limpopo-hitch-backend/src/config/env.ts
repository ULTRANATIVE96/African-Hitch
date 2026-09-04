import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Security check for production deployment
if (isProduction) {
  const missingSecrets: string[] = [];
  if (!process.env.JWT_SECRET) missingSecrets.push("JWT_SECRET");
  if (!process.env.ADMIN_JWT_SECRET) missingSecrets.push("ADMIN_JWT_SECRET");
  if (!process.env.DATABASE_URL) missingSecrets.push("DATABASE_URL");
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === "password") {
    missingSecrets.push("ADMIN_PASSWORD (must be changed from default)");
  }

  if (missingSecrets.length > 0) {
    console.error(`🚨 CRITICAL SECURITY ERROR: Missing required production env variables:\n - ${missingSecrets.join("\n - ")}`);
    console.error("Please configure all security variables in your .env file before running in production.");
    process.exit(1);
  }
}

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/limpopo_hitch?schema=public",
  JWT_SECRET: process.env.JWT_SECRET || "dev-only-secret-do-not-use-in-production",
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || "dev-only-admin-secret-do-not-use-in-production",
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "password",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};
