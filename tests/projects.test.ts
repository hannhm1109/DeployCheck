import { describe, expect, it } from "vitest";
import { createProjectSchema } from "../src/lib/validation/projects";

describe("create project validation", () => {
  it("normalizes names and slugs and stores an empty description as null", () => {
    expect(
      createProjectSchema.parse({
        name: "  Harbor API  ",
        slug: "  HARBOR-API  ",
        description: "   ",
      }),
    ).toEqual({ name: "Harbor API", slug: "harbor-api", description: null });
  });

  it("rejects malformed and reserved slugs", () => {
    for (const slug of ["two--hyphens", "bad space", "new"]) {
      expect(
        createProjectSchema.safeParse({
          name: "Example Project",
          slug,
          description: "",
        }).success,
      ).toBe(false);
    }
  });

  it("rejects a project without a usable name", () => {
    expect(
      createProjectSchema.safeParse({ name: " ", slug: "valid", description: "" })
        .success,
    ).toBe(false);
  });
});
