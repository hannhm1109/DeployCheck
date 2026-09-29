import { describe, expect, it } from "vitest";
import { ReleaseItemStatus, ReleaseItemType, ReleaseStatus } from "../src/generated/prisma/enums";
import { releaseItemSchema } from "../src/lib/validation/release-items";
import { canEditReleaseItems } from "../src/server/services/release-items";

const valid = {
  externalReference: " nsc-482 ",
  title: "  Prevent duplicate orders  ",
  type: ReleaseItemType.BUG,
  status: ReleaseItemStatus.QA_PENDING,
  notes: "  Confirm retry behavior  ",
};

describe("release items", () => {
  it("normalizes references and optional notes", () => {
    expect(releaseItemSchema.parse(valid)).toEqual({
      ...valid,
      externalReference: "NSC-482",
      title: "Prevent duplicate orders",
      notes: "Confirm retry behavior",
    });
    expect(releaseItemSchema.parse({ ...valid, notes: " " }).notes).toBeNull();
  });

  it("rejects invalid references, types, and statuses", () => {
    expect(releaseItemSchema.safeParse({ ...valid, externalReference: "bad ref" }).success).toBe(false);
    expect(releaseItemSchema.safeParse({ ...valid, type: "TASK" }).success).toBe(false);
    expect(releaseItemSchema.safeParse({ ...valid, status: "BLOCKED" }).success).toBe(false);
  });

  it("allows item edits only during draft and review", () => {
    expect(canEditReleaseItems(ReleaseStatus.DRAFT)).toBe(true);
    expect(canEditReleaseItems(ReleaseStatus.IN_REVIEW)).toBe(true);
    for (const status of [
      ReleaseStatus.READY,
      ReleaseStatus.DEPLOYING,
      ReleaseStatus.DEPLOYED,
      ReleaseStatus.FAILED,
      ReleaseStatus.ROLLED_BACK,
    ]) {
      expect(canEditReleaseItems(status)).toBe(false);
    }
  });
});
