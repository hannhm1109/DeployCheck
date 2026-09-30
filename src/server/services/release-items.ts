import { Prisma } from "@/generated/prisma/client";
import type { ReleaseItemInput } from "@/lib/validation/release-items";
import { deleteReleaseItem, insertReleaseItem, updateReleaseItem } from "@/server/data/release-items";
import { assertDemoWritable } from "@/server/demo-access";
import {
  ReleaseWriteLockedError,
  ReleaseWriteNotFoundError,
  withEditableRelease,
} from "@/server/services/release-write";

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

function mapItemError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ReleaseItemReferenceTakenError();
  }
  if (error instanceof ReleaseWriteLockedError) throw new ReleaseItemsLockedError();
  if (error instanceof ReleaseWriteNotFoundError) throw new ReleaseItemNotFoundError();
  throw error;
}

export async function addReleaseItem(workspaceId: string, releaseId: string, input: ReleaseItemInput) {
  assertDemoWritable();
  try {
    return await withEditableRelease(workspaceId, releaseId, (tx) => insertReleaseItem(tx, releaseId, input));
  } catch (error) {
    mapItemError(error);
  }
}

export async function editReleaseItem(workspaceId: string, releaseId: string, itemId: string, input: ReleaseItemInput) {
  assertDemoWritable();
  try {
    await withEditableRelease(workspaceId, releaseId, async (tx) => {
      const result = await updateReleaseItem(tx, releaseId, itemId, input);
      if (result.count === 0) throw new ReleaseItemNotFoundError();
    });
  } catch (error) {
    mapItemError(error);
  }
}

export async function removeReleaseItem(workspaceId: string, releaseId: string, itemId: string) {
  assertDemoWritable();
  try {
    await withEditableRelease(workspaceId, releaseId, async (tx) => {
      const result = await deleteReleaseItem(tx, releaseId, itemId);
      if (result.count === 0) throw new ReleaseItemNotFoundError();
    });
  } catch (error) {
    mapItemError(error);
  }
}
