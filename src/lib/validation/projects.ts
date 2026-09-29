import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Enter at least 2 characters.")
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letters, numbers, and single hyphens.")
    .refine((slug) => slug !== "new", "This slug is reserved."),
  description: z.string().trim().max(500).transform((value) => value || null),
});

export type CreateProjectInput = z.output<typeof createProjectSchema>;

export type ProjectFormValues = {
  name: string;
  slug: string;
  description: string;
};

export type ProjectFormState = {
  values: ProjectFormValues;
  errors: Partial<Record<keyof ProjectFormValues, string>>;
};
