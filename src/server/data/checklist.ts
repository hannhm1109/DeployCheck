import { Prisma } from "@/generated/prisma/client";
import type { ChecklistInput } from "@/lib/validation/checklist";

export function upsertChecklistItem(tx: Prisma.TransactionClient, releaseId: string, input: ChecklistInput) {
  const { kind, ...values } = input;
  return tx.releaseChecklistItem.upsert({
    where: { releaseId_kind: { releaseId, kind } },
    create: { releaseId, kind, ...values },
    update: values,
  });
}

export function updateRollbackPlan(tx: Prisma.TransactionClient, releaseId: string, rollbackNotes: string | null) {
  return tx.release.update({
    where: { id: releaseId },
    data: { rollbackNotes },
  });
}
