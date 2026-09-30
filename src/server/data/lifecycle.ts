import { Prisma } from "@/generated/prisma/client";
import { DeploymentResult, ReleaseStatus } from "@/generated/prisma/enums";

export async function getReleaseForTransition(tx: Prisma.TransactionClient, workspaceId: string, id: string) {
  const release = await tx.release.findFirst({
    where: { id, project: { workspaceId } },
    select: {
      status: true,
      deployedAt: true,
      rollbackNotes: true,
      project: { select: { slug: true } },
    },
  });
  if (!release) return null;

  const items = await tx.releaseItem.findMany({
    where: { releaseId: id },
    select: { externalReference: true, status: true },
  });
  const checklistItems = await tx.releaseChecklistItem.findMany({
    where: { releaseId: id },
    select: { kind: true, isComplete: true, changeRequired: true },
  });
  return { ...release, items, checklistItems };
}

export function updateReleaseStatus(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  id: string,
  current: ReleaseStatus,
  next: ReleaseStatus,
  deployedAt: Date | null,
) {
  return tx.release.updateMany({
    where: { id, project: { workspaceId }, status: current },
    data: {
      status: next,
      ...(next === ReleaseStatus.DEPLOYED ? { deployedAt } : {}),
    },
  });
}

export function insertDeploymentOutcome(
  tx: Prisma.TransactionClient,
  releaseId: string,
  result: DeploymentResult,
  occurredAt: Date,
  notes: string | null,
) {
  return tx.deployment.create({
    data: { releaseId, result, occurredAt, notes },
  });
}
