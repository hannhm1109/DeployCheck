import { Prisma } from "@/generated/prisma/client";
import type { ReleaseItemInput } from "@/lib/validation/release-items";

export function insertReleaseItem(tx: Prisma.TransactionClient, releaseId: string, input: ReleaseItemInput) {
  return tx.releaseItem.create({ data: { releaseId, ...input } });
}

export function updateReleaseItem(tx: Prisma.TransactionClient, releaseId: string, itemId: string, input: ReleaseItemInput) {
  return tx.releaseItem.updateMany({
    where: { id: itemId, releaseId },
    data: input,
  });
}

export function deleteReleaseItem(tx: Prisma.TransactionClient, releaseId: string, itemId: string) {
  return tx.releaseItem.deleteMany({ where: { id: itemId, releaseId } });
}
