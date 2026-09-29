import "dotenv/config";
import assert from "node:assert/strict";
import { createReleaseAction } from "../src/server/actions/releases";
import { REQUIRED_CHECKS } from "../src/lib/domain/releases/readiness";
import { createReleaseSchema } from "../src/lib/validation/releases";
import { getDb } from "../src/server/db";
import { createRelease } from "../src/server/services/releases";

const emptyState = {
  values: {
    projectId: "",
    version: "",
    title: "",
    description: "",
    targetDeploymentDate: "",
    rollbackNotes: "",
  },
  errors: {},
};

async function main() {
  const invalid = new FormData();
  invalid.set("version", "bad version");
  invalid.set("title", "A");
  invalid.set("targetDeploymentDate", "2026-02-30");
  const invalidResult = await createReleaseAction(emptyState, invalid);
  assert.ok(invalidResult.errors.projectId);
  assert.ok(invalidResult.errors.version);
  assert.ok(invalidResult.errors.title);
  assert.ok(invalidResult.errors.targetDeploymentDate);

  const db = getDb();
  const slug = `phase3-check-${Date.now()}`;
  let projectId: string | undefined;
  let releaseId: string | undefined;
  try {
    const project = await db.project.create({
      data: { name: "Phase 3 Check", slug },
    });
    projectId = project.id;
    const input = createReleaseSchema.parse({
      projectId,
      version: "v1.0.0",
      title: "Temporary release",
      description: "Integration check",
      targetDeploymentDate: "2026-10-15",
      rollbackNotes: "Restore the previous image",
    });
    const { release } = await createRelease(input);
    releaseId = release.id;

    const saved = await db.release.findUnique({
      where: { id: releaseId },
      include: { checklistItems: true },
    });
    assert.equal(saved?.status, "DRAFT");
    assert.equal(saved?.targetDeploymentDate?.toISOString(), "2026-10-15T00:00:00.000Z");
    assert.deepEqual(
      new Set(saved?.checklistItems.map((item) => item.kind)),
      new Set(REQUIRED_CHECKS),
    );
    assert.ok(saved?.checklistItems.every((item) => !item.isComplete));

    const duplicate = new FormData();
    duplicate.set("projectId", projectId);
    duplicate.set("version", "v1.0.0");
    duplicate.set("title", "Another release");
    const duplicateResult = await createReleaseAction(emptyState, duplicate);
    assert.equal(duplicateResult.errors.version, "This version already exists in the selected project.");

    const missing = new FormData();
    missing.set("projectId", "missing-project");
    missing.set("version", "v2.0.0");
    missing.set("title", "Another release");
    const missingResult = await createReleaseAction(emptyState, missing);
    assert.equal(missingResult.errors.projectId, "The selected project no longer exists.");
  } finally {
    if (releaseId) {
      await db.releaseChecklistItem.deleteMany({ where: { releaseId } });
      await db.release.delete({ where: { id: releaseId } });
    }
    if (projectId) await db.project.delete({ where: { id: projectId } });
    await db.$disconnect();
  }

  console.log("Release validation, creation, checklist initialization, and duplicate handling passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
