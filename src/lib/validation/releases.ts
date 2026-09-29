import { z } from "zod";

export const createReleaseSchema = z.object({
  projectId: z.string().min(1, "Choose a project."),
  version: z
    .string()
    .trim()
    .min(1, "Enter a version.")
    .max(40)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._+-]*$/, "Use letters, numbers, dots, hyphens, or plus signs."),
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  description: z.string().trim().max(1000).transform((value) => value || null),
  targetDeploymentDate: z
    .union([z.literal(""), z.iso.date()])
    .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : null)),
  rollbackNotes: z.string().trim().max(2000).transform((value) => value || null),
});

export type CreateReleaseInput = z.output<typeof createReleaseSchema>;

export type ReleaseFormValues = {
  projectId: string;
  version: string;
  title: string;
  description: string;
  targetDeploymentDate: string;
  rollbackNotes: string;
};

export type ReleaseFormState = {
  values: ReleaseFormValues;
  errors: Partial<Record<keyof ReleaseFormValues, string>>;
  message?: string;
};
