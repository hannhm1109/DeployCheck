import type { ChecklistKind } from "@/generated/prisma/enums";
import type { CreateReleaseInput } from "@/lib/validation/releases";
import { getDb } from "@/server/db";

export function listReleases(workspaceId: string) {
  return getDb().release.findMany({
    where: { project: { workspaceId } },
    select: {
      id: true,
      version: true,
      title: true,
      status: true,
      targetDeploymentDate: true,
      project: { select: { name: true, slug: true } },
    },
    orderBy: [{ createdAt: "desc" }, { version: "desc" }],
  });
}

export function getReleaseById(workspaceId: string, id: string) {
  return getDb().release.findFirst({
    where: { id, project: { workspaceId } },
    include: {
      project: { select: { name: true, slug: true } },
      items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      checklistItems: {
        select: { kind: true, isComplete: true, changeRequired: true, notes: true },
      },
      deployments: {
        select: { id: true, occurredAt: true, result: true, notes: true },
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        take: 5,
      },
    },
  });
}

export function insertRelease(
  workspaceId: string,
  input: CreateReleaseInput,
  checklistKinds: readonly ChecklistKind[],
) {
  const { projectId, ...values } = input;
  return getDb().release.create({
    data: {
      ...values,
      project: { connect: { id: projectId, workspaceId } },
      checklistItems: {
        create: checklistKinds.map((kind) => ({ kind })),
      },
    },
  });
}
