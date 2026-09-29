import { z } from "zod";
import { ReleaseStatus } from "@/generated/prisma/enums";

export const transitionInputSchema = z.object({
  nextStatus: z.enum(ReleaseStatus),
  notes: z.string().trim().max(1000).transform((value) => value || null),
});

export type TransitionInput = z.output<typeof transitionInputSchema>;

export type TransitionFormState = { error?: string };
