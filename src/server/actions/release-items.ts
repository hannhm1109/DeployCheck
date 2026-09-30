"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localizeIssue, localizeMessage } from "@/i18n/action-messages";
import { localePath, parseLocale, type AppLocale } from "@/i18n/routing";
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
import { requireActiveWorkspace } from "@/server/access";

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

function validateItemForm(values: ReleaseItemFormValues, locale: AppLocale) {
  const parsed = releaseItemSchema.safeParse(values);
  if (parsed.success) return { input: parsed.data };

  const errors: ReleaseItemFormState["errors"] = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && field in values) {
      const key = field as keyof ReleaseItemFormValues;
      errors[key] ??= localizeIssue(issue, locale);
    }
  }
  return { state: { values, errors } };
}

function knownErrorState(error: unknown, values: ReleaseItemFormValues, locale: AppLocale): ReleaseItemFormState | null {
  if (error instanceof ReadOnlyDemoError) {
    return { values, errors: {}, message: localizeMessage(error.message, locale) };
  }
  if (error instanceof ReleaseItemReferenceTakenError) {
    return { values, errors: { externalReference: localizeMessage(error.message, locale) } };
  }
  if (error instanceof ReleaseItemNotFoundError || error instanceof ReleaseItemsLockedError) {
    return { values, errors: {}, message: localizeMessage(error.message, locale) };
  }
  if (error instanceof ReleaseWriteConflictError) {
    return { values, errors: {}, message: localizeMessage(error.message, locale) };
  }
  return null;
}

export async function addReleaseItemAction(
  releaseId: string,
  _previous: ReleaseItemFormState,
  formData: FormData,
): Promise<ReleaseItemFormState> {
  const { workspace } = await requireActiveWorkspace();
  const locale = parseLocale(formData.get("locale"));
  const values = readItemForm(formData);
  const parsed = validateItemForm(values, locale);
  if (parsed.state) return parsed.state;

  try {
    await addReleaseItem(workspace.id, releaseId, parsed.input!);
  } catch (error) {
    const state = knownErrorState(error, values, locale);
    if (state) return state;
    throw error;
  }

  revalidatePath(localePath(locale, `/releases/${releaseId}`));
  redirect(localePath(locale, `/releases/${releaseId}#tickets`));
}

export async function editReleaseItemAction(
  releaseId: string,
  itemId: string,
  _previous: ReleaseItemFormState,
  formData: FormData,
): Promise<ReleaseItemFormState> {
  const { workspace } = await requireActiveWorkspace();
  const locale = parseLocale(formData.get("locale"));
  const values = readItemForm(formData);
  const parsed = validateItemForm(values, locale);
  if (parsed.state) return parsed.state;

  try {
    await editReleaseItem(workspace.id, releaseId, itemId, parsed.input!);
  } catch (error) {
    const state = knownErrorState(error, values, locale);
    if (state) return state;
    throw error;
  }

  revalidatePath(localePath(locale, `/releases/${releaseId}`));
  redirect(localePath(locale, `/releases/${releaseId}#tickets`));
}

export async function removeReleaseItemAction(
  releaseId: string,
  itemId: string,
  localeInput: string = "en",
): Promise<{ error?: string }> {
  const { workspace } = await requireActiveWorkspace();
  const locale = parseLocale(localeInput);
  try {
    await removeReleaseItem(workspace.id, releaseId, itemId);
  } catch (error) {
    if (error instanceof ReadOnlyDemoError || error instanceof ReleaseItemNotFoundError || error instanceof ReleaseItemsLockedError || error instanceof ReleaseWriteConflictError) {
      return { error: localizeMessage(error.message, locale) };
    }
    throw error;
  }
  revalidatePath(localePath(locale, `/releases/${releaseId}`));
  return {};
}
