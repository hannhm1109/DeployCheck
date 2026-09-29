import "dotenv/config";
import assert from "node:assert/strict";
import { createProjectSchema } from "../src/lib/validation/projects";
import { createProjectAction } from "../src/server/actions/projects";
import { getDb } from "../src/server/db";
import { createProject } from "../src/server/services/projects";

const initialState = {
  values: { name: "", slug: "", description: "" },
  errors: {},
};

async function main() {
  const invalid = new FormData();
  invalid.set("name", "A");
  invalid.set("slug", "bad slug");
  invalid.set("description", "");
  const invalidResult = await createProjectAction(initialState, invalid);
  assert.ok(invalidResult.errors.name);
  assert.ok(invalidResult.errors.slug);

  const slug = `phase2-check-${Date.now()}`;
  const input = createProjectSchema.parse({
    name: "Phase 2 Check",
    slug,
    description: "Temporary integration check",
  });
  const project = await createProject(input);

  try {
    const saved = await getDb().project.findUnique({ where: { slug } });
    assert.equal(saved?.name, "Phase 2 Check");

    const duplicate = new FormData();
    duplicate.set("name", "Another Project");
    duplicate.set("slug", slug);
    duplicate.set("description", "");
    const duplicateResult = await createProjectAction(initialState, duplicate);
    assert.equal(
      duplicateResult.errors.slug,
      "A project with this slug already exists.",
    );
  } finally {
    await getDb().project.delete({ where: { id: project.id } });
    await getDb().$disconnect();
  }

  console.log("Project validation, creation, and duplicate handling passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
