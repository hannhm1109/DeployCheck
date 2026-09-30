import "dotenv/config";
import assert from "node:assert/strict";
import { createProjectSchema } from "../src/lib/validation/projects";
import { getDb } from "../src/server/db";
import { createProject, ProjectSlugTakenError } from "../src/server/services/projects";

const workspaceId = "legacy-workspace";

async function main() {
  assert.equal(createProjectSchema.safeParse({ name: "A", slug: "bad slug", description: "" }).success, false);

  const slug = `phase2-check-${Date.now()}`;
  const input = createProjectSchema.parse({
    name: "Phase 2 Check",
    slug,
    description: "Temporary integration check",
  });
  const project = await createProject(workspaceId, input);

  try {
    const saved = await getDb().project.findUnique({ where: { workspaceId_slug: { workspaceId, slug } } });
    assert.equal(saved?.name, "Phase 2 Check");
    await assert.rejects(() => createProject(workspaceId, { ...input, name: "Another Project" }), ProjectSlugTakenError);
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
