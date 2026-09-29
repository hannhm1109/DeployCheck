import type { ReleaseItemInput } from "@/lib/validation/release-items";
import { getDb } from "@/server/db";

export function insertReleaseItem(releaseId: string, input: ReleaseItemInput) {
  return getDb().releaseItem.create({ data: { releaseId, ...input } });
}

export function updateReleaseItem(releaseId: string, itemId: string, input: ReleaseItemInput) {
  return getDb().releaseItem.updateMany({
    where: { id: itemId, releaseId },
    data: input,
  });
}

export function deleteReleaseItem(releaseId: string, itemId: string) {
  return getDb().releaseItem.deleteMany({ where: { id: itemId, releaseId } });
}
