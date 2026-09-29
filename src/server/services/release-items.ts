import { Prisma } from "@/generated/prisma/client";
import { ReleaseStatus } from "@/generated/prisma/enums";
import type { ReleaseItemInput } from "@/lib/validation/release-items";
import { deleteReleaseItem, insertReleaseItem, updateReleaseItem } from "@/server/data/release-items";
import { getReleaseForItems } from "@/server/data/releases";

const editableStatuses = new Set<ReleaseStatus>([
  ReleaseStatus.DRAFT,
  ReleaseStatus.IN_REVIEW,
]);

export function canEditReleaseItems(status: ReleaseStatus): boolean {
  return editableStatuses.has(status);
}

export class ReleaseItemsLockedError extends Error {
  constructor() {
    super("Items can only be changed while the release is Draft or In review.");
  }
}

export class ReleaseItemNotFoundError extends Error {
  constructor() {
    super("This item no longer exists in the release.");
  }
}

export class ReleaseItemReferenceTakenError extends Error {
  constructor() {
    super("This reference already exists in the release.");
  }
}

async function assertEditable(releaseId: string) {
  const release = await getReleaseForItems(releaseId);
  if (!release) throw new ReleaseItemNotFoundError();
  if (!canEditReleaseItems(release.status)) throw new ReleaseItemsLockedError();
}

function mapDuplicateReference(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ReleaseItemReferenceTakenError();
  }
  throw error;
}

export async function addReleaseItem(releaseId: string, input: ReleaseItemInput) {
  await assertEditable(releaseId);
  try {
    return await insertReleaseItem(releaseId, input);
  } catch (error) {
    mapDuplicateReference(error);
  }
}

export async function editReleaseItem(releaseId: string, itemId: string, input: ReleaseItemInput) {
  await assertEditable(releaseId);
  try {
    const result = await updateReleaseItem(releaseId, itemId, input);
    if (result.count === 0) throw new ReleaseItemNotFoundError();
  } catch (error) {
    mapDuplicateReference(error);
  }
}

export async function removeReleaseItem(releaseId: string, itemId: string) {
  await assertEditable(releaseId);
  const result = await deleteReleaseItem(releaseId, itemId);
  if (result.count === 0) throw new ReleaseItemNotFoundError();
}
