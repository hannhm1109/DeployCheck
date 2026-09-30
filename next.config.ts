import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGIN
    ? [process.env.DEV_ALLOWED_ORIGIN]
    : [],
  distDir: process.env.VERCEL
    ? ".next"
    : process.env.NODE_ENV === "production" ? ".next-build" : ".next-dev-local",
};

export default createNextIntlPlugin()(nextConfig);
