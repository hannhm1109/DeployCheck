import "dotenv/config";
import assert from "node:assert/strict";
import { REQUIRED_CHECKS } from "../src/lib/domain/releases/readiness";
import { createReleaseSchema } from "../src/lib/validation/releases";
import { getDb } from "../src/server/db";
import { createRelease, ReleaseProjectNotFoundError, ReleaseVersionTakenError } from "../src/server/services/releases";

const workspaceId = "legacy-workspace";

async function main() {
  assert.equal(createReleaseSchema.safeParse({ projectId: "", version: "bad version", title: "A", description: "", targetDeploymentDate: "2026-02-30", rollbackNotes: "" }).success, false);

  const db = getDb();
  const slug = `phase3-check-${Date.now()}`;
  let projectId: string | undefined;
  let releaseId: string | undefined;
  try {
    const project = await db.project.create({
      data: { name: "Phase 3 Check", slug, workspaceId },
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
    const { release } = await createRelease(workspaceId, input);
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

    await assert.rejects(() => createRelease(workspaceId, { ...input, title: "Another release" }), ReleaseVersionTakenError);
    await assert.rejects(() => createRelease(workspaceId, { ...input, projectId: "missing-project", version: "v2.0.0" }), ReleaseProjectNotFoundError);
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
