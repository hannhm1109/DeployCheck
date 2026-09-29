import { describe, expect, it } from "vitest";
import { ChecklistKind, ReleaseItemStatus, ReleaseItemType, ReleaseStatus } from "../src/generated/prisma/enums";
import { checklistInputSchema } from "../src/lib/validation/checklist";
import { transitionInputSchema } from "../src/lib/validation/lifecycle";
import { createProjectSchema } from "../src/lib/validation/projects";
import { releaseItemSchema } from "../src/lib/validation/release-items";
import { createReleaseSchema } from "../src/lib/validation/releases";

describe("server validation boundaries", () => {
  it("rejects project and release text beyond form limits", () => {
    expect(createProjectSchema.safeParse({ name: "x".repeat(81), slug: "example", description: "" }).success).toBe(false);
    expect(createReleaseSchema.safeParse({
      projectId: "project-id",
      version: "v1.0.0",
      title: "x".repeat(121),
      description: "",
      targetDeploymentDate: "",
      rollbackNotes: "",
    }).success).toBe(false);
  });

  it("rejects forged item and checklist choices", () => {
    const item = { externalReference: "ABC-1", title: "Example ticket", type: ReleaseItemType.BUG, status: ReleaseItemStatus.READY, notes: "" };
    expect(releaseItemSchema.safeParse({ ...item, status: "DEPLOYED" }).success).toBe(false);
    expect(releaseItemSchema.safeParse({ ...item, externalReference: "BAD REF" }).success).toBe(false);
    expect(checklistInputSchema.safeParse({ kind: ChecklistKind.BACKGROUND_JOBS_CHECKED, isComplete: "true", changeRequired: "maybe", notes: "" }).success).toBe(false);
  });

  it("rejects invalid transitions and oversized outcome notes", () => {
    expect(transitionInputSchema.safeParse({ nextStatus: "PUBLISHED", notes: "" }).success).toBe(false);
    expect(transitionInputSchema.safeParse({ nextStatus: ReleaseStatus.DEPLOYED, notes: "x".repeat(1001) }).success).toBe(false);
  });
});
