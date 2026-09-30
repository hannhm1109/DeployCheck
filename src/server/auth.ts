import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { getDb } from "@/server/db";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret || secret.length < 32 || secret.includes("replace-with")) {
  throw new Error("BETTER_AUTH_SECRET must be a unique secret of at least 32 characters");
}
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is required");
}

export const auth = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(getDb(), { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  rateLimit: { enabled: true },
  trustedOrigins: process.env.NODE_ENV === "development" && process.env.DEV_ALLOWED_ORIGIN
    ? [`http://${process.env.DEV_ALLOWED_ORIGIN}:3000`]
    : [],
});
