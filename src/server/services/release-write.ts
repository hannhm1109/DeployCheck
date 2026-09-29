import { Prisma } from "@/generated/prisma/client";
import { EDITABLE_RELEASE_STATUSES } from "@/lib/domain/releases/editability";
import { getDb } from "@/server/db";

export class ReleaseWriteNotFoundError extends Error {}
export class ReleaseWriteLockedError extends Error {}
export class ReleaseWriteConflictError extends Error {
  constructor() {
    super("The release changed while saving. Try again.");
  }
}

export async function runSerializableTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await getDb().$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        if (attempt < 2) continue;
        throw new ReleaseWriteConflictError();
      }
      throw error;
    }
  }
  throw new ReleaseWriteConflictError();
}

export function withEditableRelease<T>(
  releaseId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return runSerializableTransaction(async (tx) => {
    const locked = await tx.release.updateMany({
      where: { id: releaseId, status: { in: [...EDITABLE_RELEASE_STATUSES] } },
      data: { updatedAt: new Date() },
    });
    if (locked.count !== 1) {
      const release = await tx.release.findUnique({
        where: { id: releaseId },
        select: { id: true },
      });
      if (!release) throw new ReleaseWriteNotFoundError();
      throw new ReleaseWriteLockedError();
    }
    return work(tx);
  });
}
