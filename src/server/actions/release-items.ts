"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  releaseItemSchema,
  type ReleaseItemFormState,
  type ReleaseItemFormValues,
} from "@/lib/validation/release-items";
import {
  addReleaseItem,
  editReleaseItem,
  removeReleaseItem,
  ReleaseItemNotFoundError,
  ReleaseItemReferenceTakenError,
  ReleaseItemsLockedError,
} from "@/server/services/release-items";
import { ReleaseWriteConflictError } from "@/server/services/release-write";
import { ReadOnlyDemoError } from "@/server/demo-access";

function formValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function readItemForm(formData: FormData): ReleaseItemFormValues {
  return {
    externalReference: formValue(formData.get("externalReference")),
    title: formValue(formData.get("title")),
    type: formValue(formData.get("type")),
    status: formValue(formData.get("status")),
    notes: formValue(formData.get("notes")),
  };
}

function validateItemForm(values: ReleaseItemFormValues) {
  const parsed = releaseItemSchema.safeParse(values);
  if (parsed.success) return { input: parsed.data };

  const errors: ReleaseItemFormState["errors"] = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && field in values) {
      const key = field as keyof ReleaseItemFormValues;
      errors[key] ??= issue.message;
    }
  }
  return { state: { values, errors } };
}

function knownErrorState(error: unknown, values: ReleaseItemFormValues): ReleaseItemFormState | null {
  if (error instanceof ReadOnlyDemoError) {
    return { values, errors: {}, message: error.message };
  }
  if (error instanceof ReleaseItemReferenceTakenError) {
    return { values, errors: { externalReference: error.message } };
  }
  if (error instanceof ReleaseItemNotFoundError || error instanceof ReleaseItemsLockedError) {
    return { values, errors: {}, message: error.message };
  }
  if (error instanceof ReleaseWriteConflictError) {
    return { values, errors: {}, message: error.message };
  }
  return null;
}

export async function addReleaseItemAction(
  releaseId: string,
  _previous: ReleaseItemFormState,
  formData: FormData,
): Promise<ReleaseItemFormState> {
  const values = readItemForm(formData);
  const parsed = validateItemForm(values);
  if (parsed.state) return parsed.state;

  try {
    await addReleaseItem(releaseId, parsed.input!);
  } catch (error) {
    const state = knownErrorState(error, values);
    if (state) return state;
    throw error;
  }

  revalidatePath(`/releases/${releaseId}`);
  redirect(`/releases/${releaseId}#tickets`);
}

export async function editReleaseItemAction(
  releaseId: string,
  itemId: string,
  _previous: ReleaseItemFormState,
  formData: FormData,
): Promise<ReleaseItemFormState> {
  const values = readItemForm(formData);
  const parsed = validateItemForm(values);
  if (parsed.state) return parsed.state;

  try {
    await editReleaseItem(releaseId, itemId, parsed.input!);
  } catch (error) {
    const state = knownErrorState(error, values);
    if (state) return state;
    throw error;
  }

  revalidatePath(`/releases/${releaseId}`);
  redirect(`/releases/${releaseId}#tickets`);
}

export async function removeReleaseItemAction(
  releaseId: string,
  itemId: string,
): Promise<{ error?: string }> {
  try {
    await removeReleaseItem(releaseId, itemId);
  } catch (error) {
    if (error instanceof ReadOnlyDemoError || error instanceof ReleaseItemNotFoundError || error instanceof ReleaseItemsLockedError || error instanceof ReleaseWriteConflictError) {
      return { error: error.message };
    }
    throw error;
  }
  revalidatePath(`/releases/${releaseId}`);
  return {};
}
