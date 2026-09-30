import type { ChecklistInput } from "@/lib/validation/checklist";
import { updateRollbackPlan, upsertChecklistItem } from "@/server/data/checklist";
import { assertDemoWritable } from "@/server/demo-access";
import {
  ReleaseWriteLockedError,
  ReleaseWriteNotFoundError,
  withEditableRelease,
} from "@/server/services/release-write";

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

function mapChecklistError(error: unknown): never {
  if (error instanceof ReleaseWriteNotFoundError) throw new ChecklistReleaseNotFoundError();
  if (error instanceof ReleaseWriteLockedError) throw new ChecklistLockedError();
  throw error;
}

export async function saveChecklistItem(workspaceId: string, releaseId: string, input: ChecklistInput) {
  assertDemoWritable();
  try {
    return await withEditableRelease(workspaceId, releaseId, (tx) => upsertChecklistItem(tx, releaseId, input));
  } catch (error) {
    mapChecklistError(error);
  }
}

export async function saveRollbackPlan(workspaceId: string, releaseId: string, rollbackNotes: string | null) {
  assertDemoWritable();
  try {
    return await withEditableRelease(workspaceId, releaseId, (tx) => updateRollbackPlan(tx, releaseId, rollbackNotes));
  } catch (error) {
    mapChecklistError(error);
  }
}
