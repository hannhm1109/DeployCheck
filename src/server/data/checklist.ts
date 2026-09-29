import type { ChecklistInput } from "@/lib/validation/checklist";
import { getDb } from "@/server/db";

export function upsertChecklistItem(releaseId: string, input: ChecklistInput) {
  const { kind, ...values } = input;
  return getDb().releaseChecklistItem.upsert({
    where: { releaseId_kind: { releaseId, kind } },
    create: { releaseId, kind, ...values },
    update: values,
  });
}

export function updateRollbackPlan(releaseId: string, rollbackNotes: string | null) {
  return getDb().release.update({
    where: { id: releaseId },
    data: { rollbackNotes },
  });
}
