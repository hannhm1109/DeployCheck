"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProjectSchema,
  type ProjectFormState,
  type ProjectFormValues,
} from "@/lib/validation/projects";
import {
  createProject,
  ProjectSlugTakenError,
} from "@/server/services/projects";
import { ReadOnlyDemoError } from "@/server/demo-access";

function formValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function createProjectAction(
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const values: ProjectFormValues = {
    name: formValue(formData.get("name")),
    slug: formValue(formData.get("slug")),
    description: formValue(formData.get("description")),
  };
  const parsed = createProjectSchema.safeParse(values);

  if (!parsed.success) {
    const errors: ProjectFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        (field === "name" || field === "slug" || field === "description") &&
        !errors[field]
      ) {
        errors[field] = issue.message;
      }
    }
    return { values, errors };
  }

  let project;
  try {
    project = await createProject(parsed.data);
  } catch (error) {
    if (error instanceof ReadOnlyDemoError) {
      return { values, errors: {}, message: error.message };
    }
    if (error instanceof ProjectSlugTakenError) {
      return { values, errors: { slug: error.message } };
    }
    throw error;
  }

  revalidatePath("/projects");
  redirect(`/projects/${project.slug}`);
}
