import { z } from "zod";
import { ChecklistKind } from "@/generated/prisma/enums";
import { requiresChangeDecision } from "@/lib/domain/releases/readiness";

export const checklistInputSchema = z
  .object({
    kind: z.enum(ChecklistKind),
    isComplete: z.enum(["true", "false"]).transform((value) => value === "true"),
    changeRequired: z.enum(["", "true", "false"]),
    notes: z.string().trim().max(1000).transform((value) => value || null),
  })
  .superRefine((value, context) => {
    if (!requiresChangeDecision(value.kind) && value.changeRequired !== "") {
      context.addIssue({
        code: "custom",
        path: ["changeRequired"],
        message: "This check does not need a change decision.",
      });
    }
  })
  .transform((value) => ({
    kind: value.kind,
    isComplete: value.isComplete,
    changeRequired: value.changeRequired === "" ? null : value.changeRequired === "true",
    notes: value.notes,
  }));

export const rollbackPlanSchema = z.string().trim().max(2000).transform((value) => value || null);

export type ChecklistInput = z.output<typeof checklistInputSchema>;

export type ChecklistFormValues = {
  isComplete: boolean;
  changeRequired: "" | "true" | "false";
  notes: string;
};

export type ChecklistFormState = {
  values: ChecklistFormValues;
  errors: Partial<Record<keyof ChecklistFormValues, string>>;
  message?: string;
};

export type RollbackFormState = {
  value: string;
  error?: string;
};
