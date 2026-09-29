import { z } from "zod";
import { ReleaseItemStatus, ReleaseItemType } from "@/generated/prisma/enums";

export const releaseItemSchema = z.object({
  externalReference: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Enter a ticket reference.")
    .max(40)
    .regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, "Use letters, numbers, and hyphens."),
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(160),
  type: z.enum(ReleaseItemType),
  status: z.enum(ReleaseItemStatus),
  notes: z.string().trim().max(1000).transform((value) => value || null),
});

export type ReleaseItemInput = z.output<typeof releaseItemSchema>;

export type ReleaseItemFormValues = {
  externalReference: string;
  title: string;
  type: string;
  status: string;
  notes: string;
};

export type ReleaseItemFormState = {
  values: ReleaseItemFormValues;
  errors: Partial<Record<keyof ReleaseItemFormValues, string>>;
  message?: string;
};
