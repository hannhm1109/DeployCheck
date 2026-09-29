"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChecklistKind } from "@/generated/prisma/enums";
import {
  checklistInputSchema,
  rollbackPlanSchema,
  type ChecklistFormState,
  type ChecklistFormValues,
  type RollbackFormState,
} from "@/lib/validation/checklist";
import {
  ChecklistLockedError,
  ChecklistReleaseNotFoundError,
  saveChecklistItem,
  saveRollbackPlan,
} from "@/server/services/checklist";
import { ReleaseWriteConflictError } from "@/server/services/release-write";

function formValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function saveChecklistItemAction(
  releaseId: string,
  kind: ChecklistKind,
  _previous: ChecklistFormState,
  formData: FormData,
): Promise<ChecklistFormState> {
  const rawComplete = formData.get("isComplete");
  const values: ChecklistFormValues = {
    isComplete: rawComplete === "true",
    changeRequired: formValue(formData.get("changeRequired")) as ChecklistFormValues["changeRequired"],
    notes: formValue(formData.get("notes")),
  };
  const parsed = checklistInputSchema.safeParse({
    kind,
    isComplete: rawComplete === null ? "false" : rawComplete,
    changeRequired: values.changeRequired,
    notes: values.notes,
  });
  if (!parsed.success) {
    const errors: ChecklistFormState["errors"] = {};
    let message: string | undefined;
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "isComplete" || field === "changeRequired" || field === "notes") {
        errors[field] ??= issue.message;
      } else {
        message = "This check is not recognized.";
      }
    }
    return { values, errors, message };
  }

  try {
    await saveChecklistItem(releaseId, parsed.data);
  } catch (error) {
    if (error instanceof ChecklistLockedError || error instanceof ChecklistReleaseNotFoundError || error instanceof ReleaseWriteConflictError) {
      return { values, errors: {}, message: error.message };
    }
    throw error;
  }

  revalidatePath(`/releases/${releaseId}`);
  redirect(`/releases/${releaseId}#checklist`);
}

export async function saveRollbackPlanAction(
  releaseId: string,
  _previous: RollbackFormState,
  formData: FormData,
): Promise<RollbackFormState> {
  const value = formValue(formData.get("rollbackNotes"));
  const parsed = rollbackPlanSchema.safeParse(value);
  if (!parsed.success) return { value, error: "Keep the rollback plan under 2,000 characters." };

  try {
    await saveRollbackPlan(releaseId, parsed.data);
  } catch (error) {
    if (error instanceof ChecklistLockedError || error instanceof ChecklistReleaseNotFoundError || error instanceof ReleaseWriteConflictError) {
      return { value, error: error.message };
    }
    throw error;
  }

  revalidatePath(`/releases/${releaseId}`);
  redirect(`/releases/${releaseId}#rollback`);
}
