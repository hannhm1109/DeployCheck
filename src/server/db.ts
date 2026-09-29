import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  deploycheckPrisma?: PrismaClient;
};

let productionClient: PrismaClient | undefined;

export function getDb(): PrismaClient {
  const existing =
    process.env.NODE_ENV === "production"
      ? productionClient
      : globalForPrisma.deploycheckPrisma;
  if (existing) return existing;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to access the database");
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: process.env.NODE_ENV === "production" ? 2 : 10,
    }),
  });
  if (process.env.NODE_ENV === "production") {
    productionClient = client;
  } else {
    globalForPrisma.deploycheckPrisma = client;
  }
  return client;
}
