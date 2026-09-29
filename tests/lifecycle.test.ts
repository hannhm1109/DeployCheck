import { describe, expect, it } from "vitest";
import { ReleaseStatus } from "../src/generated/prisma/enums";
import { transitionInputSchema } from "../src/lib/validation/lifecycle";

describe("transition input", () => {
  it("normalizes optional outcome notes", () => {
    expect(transitionInputSchema.parse({
      nextStatus: ReleaseStatus.DEPLOYED,
      notes: "  Smoke checks passed  ",
    })).toEqual({
      nextStatus: ReleaseStatus.DEPLOYED,
      notes: "Smoke checks passed",
    });
    expect(transitionInputSchema.parse({
      nextStatus: ReleaseStatus.FAILED,
      notes: "  ",
    }).notes).toBeNull();
  });

  it("rejects unknown statuses and oversized notes", () => {
    expect(transitionInputSchema.safeParse({ nextStatus: "PUBLISHED", notes: "" }).success).toBe(false);
    expect(transitionInputSchema.safeParse({
      nextStatus: ReleaseStatus.FAILED,
      notes: "x".repeat(1001),
    }).success).toBe(false);
  });
});
