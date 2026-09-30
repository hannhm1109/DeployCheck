import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { WorkspaceRole } from "@/generated/prisma/enums";
import { getDb } from "@/server/db";

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export class InvalidInvitationError extends Error {}

function invitationHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createWorkspace(userId: string, name: string) {
  const base = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "team";
  const slug = `${base}-${randomBytes(4).toString("hex")}`;

  return getDb().$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: { name, slug } });
    await tx.membership.create({ data: { userId, workspaceId: workspace.id, role: WorkspaceRole.OWNER } });
    return workspace;
  });
}

export async function createInvitation(workspaceId: string, userId: string) {
  const owner = await getDb().membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
  if (owner?.role !== WorkspaceRole.OWNER) throw new Error("Only workspace owners can create invitations.");

  const token = randomBytes(32).toString("hex");
  await getDb().workspaceInvitation.create({
    data: {
      workspaceId,
      createdById: userId,
      tokenHash: invitationHash(token),
      expiresAt: new Date(Date.now() + invitationLifetimeMs),
    },
  });
  return token;
}

export async function getInvitation(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return getDb().workspaceInvitation.findFirst({
    where: { tokenHash: invitationHash(token), usedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, workspaceId: true, workspace: { select: { name: true } } },
  });
}

export async function joinWorkspace(userId: string, token: string) {
  const invitation = await getInvitation(token);
  if (!invitation) throw new InvalidInvitationError("This invitation is invalid or has expired.");

  return getDb().$transaction(async (tx) => {
    const claimed = await tx.workspaceInvitation.updateMany({
      where: { id: invitation.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw new InvalidInvitationError("This invitation has already been used.");
    await tx.membership.upsert({
      where: { userId_workspaceId: { userId, workspaceId: invitation.workspaceId } },
      update: {},
      create: { userId, workspaceId: invitation.workspaceId, role: WorkspaceRole.MEMBER },
    });
    return invitation.workspaceId;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
