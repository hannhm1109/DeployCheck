import { canEditReleaseContent } from "@/lib/domain/releases/editability";
import type { ChecklistInput } from "@/lib/validation/checklist";
import { updateRollbackPlan, upsertChecklistItem } from "@/server/data/checklist";
import { getReleaseForContent } from "@/server/data/releases";

export class ChecklistReleaseNotFoundError extends Error {
  constructor() {
    super("This release no longer exists.");
  }
}

export class ChecklistLockedError extends Error {
  constructor() {
    super("Checks can only be changed while the release is Draft or In review.");
  }
}

async function assertEditable(releaseId: string) {
  const release = await getReleaseForContent(releaseId);
  if (!release) throw new ChecklistReleaseNotFoundError();
  if (!canEditReleaseContent(release.status)) throw new ChecklistLockedError();
}

export async function saveChecklistItem(releaseId: string, input: ChecklistInput) {
  await assertEditable(releaseId);
  return upsertChecklistItem(releaseId, input);
}

export async function saveRollbackPlan(releaseId: string, rollbackNotes: string | null) {
  await assertEditable(releaseId);
  return updateRollbackPlan(releaseId, rollbackNotes);
}
