import { describe, expect, it } from "vitest";
import { ChecklistKind } from "../src/generated/prisma/enums";
import { checklistInputSchema, rollbackPlanSchema } from "../src/lib/validation/checklist";
import { CHECK_LABELS, requiresChangeDecision } from "../src/lib/domain/releases/readiness";

describe("checklist validation", () => {
  it("normalizes a change decision and notes", () => {
    expect(checklistInputSchema.parse({
      kind: ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED,
      isComplete: "true",
      changeRequired: "false",
      notes: "  No new variables  ",
    })).toEqual({
      kind: ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED,
      isComplete: true,
      changeRequired: false,
      notes: "No new variables",
    });
  });

  it("allows an incomplete check without a decision", () => {
    expect(checklistInputSchema.parse({
      kind: ChecklistKind.DATABASE_MIGRATION_CHECKED,
      isComplete: "false",
      changeRequired: "",
      notes: " ",
    }).changeRequired).toBeNull();
  });

  it("rejects a change decision on QA or rollback checks", () => {
    expect(checklistInputSchema.safeParse({
      kind: ChecklistKind.QA_VALIDATED,
      isComplete: "true",
      changeRequired: "true",
      notes: "",
    }).success).toBe(false);
  });

  it("rejects unknown checks and malformed fields", () => {
    expect(checklistInputSchema.safeParse({
      kind: "UNKNOWN",
      isComplete: "yes",
      changeRequired: "sometimes",
      notes: "",
    }).success).toBe(false);
  });

  it("keeps decision requirements and labels explicit", () => {
    expect(requiresChangeDecision(ChecklistKind.BACKGROUND_JOBS_CHECKED)).toBe(true);
    expect(requiresChangeDecision(ChecklistKind.QA_VALIDATED)).toBe(false);
    expect(CHECK_LABELS[ChecklistKind.ROLLBACK_PLAN_DOCUMENTED]).toBe("Rollback plan check");
  });

  it("normalizes rollback notes and rejects oversized plans", () => {
    expect(rollbackPlanSchema.parse("  Restore v1  ")).toBe("Restore v1");
    expect(rollbackPlanSchema.parse("  ")).toBeNull();
    expect(rollbackPlanSchema.safeParse("x".repeat(2001)).success).toBe(false);
  });
});
