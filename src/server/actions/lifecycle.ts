"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const rawNotes = formData.get("notes");
  const parsed = transitionInputSchema.safeParse({
    nextStatus,
    notes: typeof rawNotes === "string" ? rawNotes : "",
  });
  if (!parsed.success) {
    return { error: "Choose a valid status and keep notes under 1,000 characters." };
  }

  let projectSlug: string;
  try {
    const result = await transitionReleaseStatus(releaseId, parsed.data);
    projectSlug = result.projectSlug;
  } catch (error) {
    if (error instanceof ReadOnlyDemoError || error instanceof ReleaseTransitionNotFoundError || error instanceof ReleaseTransitionRejectedError || error instanceof ReleaseWriteConflictError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/releases/${releaseId}`);
  revalidatePath("/releases");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectSlug}`);
  redirect(`/releases/${releaseId}#lifecycle`);
}
