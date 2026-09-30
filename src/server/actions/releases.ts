"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localizeIssue, localizeMessage } from "@/i18n/action-messages";
import { localePath, parseLocale } from "@/i18n/routing";
import {
  createReleaseSchema,
  type ReleaseFormState,
  type ReleaseFormValues,
} from "@/lib/validation/releases";
import {
  createRelease,
  ReleaseProjectNotFoundError,
  ReleaseVersionTakenError,
} from "@/server/services/releases";
import { ReadOnlyDemoError } from "@/server/demo-access";

function formValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function createReleaseAction(
  _previous: ReleaseFormState,
  formData: FormData,
): Promise<ReleaseFormState> {
  const locale = parseLocale(formData.get("locale"));
  const values: ReleaseFormValues = {
    projectId: formValue(formData.get("projectId")),
    version: formValue(formData.get("version")),
    title: formValue(formData.get("title")),
    description: formValue(formData.get("description")),
    targetDeploymentDate: formValue(formData.get("targetDeploymentDate")),
    rollbackNotes: formValue(formData.get("rollbackNotes")),
  };
  const parsed = createReleaseSchema.safeParse(values);

  if (!parsed.success) {
    const errors: ReleaseFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && field in values) {
        const key = field as keyof ReleaseFormValues;
        errors[key] ??= localizeIssue(issue, locale);
      }
    }
    return { values, errors };
  }

  let created;
  try {
    created = await createRelease(parsed.data);
  } catch (error) {
    if (error instanceof ReadOnlyDemoError) {
      return { values, errors: {}, message: localizeMessage(error.message, locale) };
    }
    if (error instanceof ReleaseVersionTakenError) {
      return { values, errors: { version: localizeMessage(error.message, locale) } };
    }
    if (error instanceof ReleaseProjectNotFoundError) {
      return { values, errors: { projectId: localizeMessage(error.message, locale) } };
    }
    throw error;
  }

  revalidatePath(localePath(locale, "/releases"));
  revalidatePath(localePath(locale, "/projects"));
  revalidatePath(localePath(locale, `/projects/${created.projectSlug}`));
  redirect(localePath(locale, `/releases/${created.release.id}`));
}
