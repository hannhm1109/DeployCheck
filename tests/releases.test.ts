import { describe, expect, it } from "vitest";
import { createReleaseSchema } from "../src/lib/validation/releases";

const valid = {
  projectId: "project-id",
  version: "v1.2.0",
  title: "Autumn storefront update",
  description: "  Improvements  ",
  targetDeploymentDate: "2026-10-15",
  rollbackNotes: "  Restore the previous image  ",
};

describe("createReleaseSchema", () => {
  it("normalizes optional text and the date", () => {
    const result = createReleaseSchema.parse(valid);
    expect(result).toEqual({
      ...valid,
      description: "Improvements",
      targetDeploymentDate: new Date("2026-10-15T00:00:00.000Z"),
      rollbackNotes: "Restore the previous image",
    });
  });

  it("allows empty optional fields", () => {
    const result = createReleaseSchema.parse({
      ...valid,
      description: " ",
      targetDeploymentDate: "",
      rollbackNotes: " ",
    });
    expect(result.description).toBeNull();
    expect(result.targetDeploymentDate).toBeNull();
    expect(result.rollbackNotes).toBeNull();
  });

  it.each(["2026-02-30", "2026-13-01", "10/15/2026"])(
    "rejects invalid date %s",
    (targetDeploymentDate) => {
      expect(createReleaseSchema.safeParse({ ...valid, targetDeploymentDate }).success).toBe(false);
    },
  );

  it("requires a project and rejects malformed versions", () => {
    expect(createReleaseSchema.safeParse({ ...valid, projectId: "" }).success).toBe(false);
    expect(createReleaseSchema.safeParse({ ...valid, version: "bad version" }).success).toBe(false);
  });
});
