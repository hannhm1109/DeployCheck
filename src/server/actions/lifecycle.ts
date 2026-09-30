"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localizeMessage } from "@/i18n/action-messages";
import { localePath, parseLocale } from "@/i18n/routing";
import { transitionInputSchema, type TransitionFormState } from "@/lib/validation/lifecycle";
import {
  ReleaseTransitionNotFoundError,
  ReleaseTransitionRejectedError,
  transitionReleaseStatus,
} from "@/server/services/lifecycle";
import { ReleaseWriteConflictError } from "@/server/services/release-write";
import { ReadOnlyDemoError } from "@/server/demo-access";

export async function transitionReleaseAction(
  releaseId: string,
  nextStatus: string,
  _previous: TransitionFormState,
  formData: FormData,
): Promise<TransitionFormState> {
  const locale = parseLocale(formData.get("locale"));
  const rawNotes = formData.get("notes");
  const parsed = transitionInputSchema.safeParse({
    nextStatus,
    notes: typeof rawNotes === "string" ? rawNotes : "",
  });
  if (!parsed.success) {
    return { error: localizeMessage("Choose a valid status and keep notes under 1,000 characters.", locale) };
  }

  let projectSlug: string;
  try {
    const result = await transitionReleaseStatus(releaseId, parsed.data);
    projectSlug = result.projectSlug;
  } catch (error) {
    if (error instanceof ReadOnlyDemoError || error instanceof ReleaseTransitionNotFoundError || error instanceof ReleaseTransitionRejectedError || error instanceof ReleaseWriteConflictError) {
      return { error: localizeMessage(error.message, locale) };
    }
    throw error;
  }

  revalidatePath(localePath(locale, `/releases/${releaseId}`));
  revalidatePath(localePath(locale, "/releases"));
  revalidatePath(localePath(locale, "/projects"));
  revalidatePath(localePath(locale, `/projects/${projectSlug}`));
  redirect(localePath(locale, `/releases/${releaseId}#lifecycle`));
}
