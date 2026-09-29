import type { ChecklistKind } from "@/generated/prisma/enums";
import type { CreateReleaseInput } from "@/lib/validation/releases";
import { getDb } from "@/server/db";

export function listReleases() {
  return getDb().release.findMany({
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

export function getReleaseById(id: string) {
  return getDb().release.findUnique({
    where: { id },
    include: {
      project: { select: { name: true, slug: true } },
      items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      checklistItems: {
        select: { kind: true, isComplete: true, changeRequired: true },
      },
    },
  });
}

export function getReleaseForItems(id: string) {
  return getDb().release.findUnique({
    where: { id },
    select: { status: true },
  });
}

export function insertRelease(
  input: CreateReleaseInput,
  checklistKinds: readonly ChecklistKind[],
) {
  return getDb().release.create({
    data: {
      ...input,
      checklistItems: {
        create: checklistKinds.map((kind) => ({ kind })),
      },
    },
  });
}
