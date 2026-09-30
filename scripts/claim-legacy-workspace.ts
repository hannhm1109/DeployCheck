import "dotenv/config";
import { Prisma } from "../src/generated/prisma/client";
import { WorkspaceRole } from "../src/generated/prisma/enums";
import { getDb } from "../src/server/db";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: npm run workspace:claim -- your-email@example.com");
  }

  const db = getDb();
  try {
    await db.$transaction(async (tx) => {
      const workspace = await tx.workspace.findUnique({ where: { slug: "legacy-demo" } });
      const user = await tx.user.findUnique({ where: { email } });
      if (!workspace || !user) throw new Error("Register the account first, then claim the legacy workspace.");

      const existingOwner = await tx.membership.findFirst({
        where: { workspaceId: workspace.id, role: WorkspaceRole.OWNER },
      });
      if (existingOwner && existingOwner.userId !== user.id) {
        throw new Error("The legacy workspace already has an owner. Ask that owner for an invite link.");
      }
      await tx.membership.upsert({
        where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
        update: { role: WorkspaceRole.OWNER },
        create: { userId: user.id, workspaceId: workspace.id, role: WorkspaceRole.OWNER },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    console.log("Legacy workspace assigned. Sign in and select DeployCheck Demo if needed.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
