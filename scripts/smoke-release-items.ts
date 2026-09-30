import "dotenv/config";
import assert from "node:assert/strict";
import { ReleaseItemStatus, ReleaseItemType, ReleaseStatus } from "../src/generated/prisma/enums";
import { calculateReleaseReadiness } from "../src/lib/domain/releases/readiness";
import { releaseItemSchema } from "../src/lib/validation/release-items";
import { createReleaseSchema } from "../src/lib/validation/releases";
import { getDb } from "../src/server/db";
import {
  addReleaseItem,
  editReleaseItem,
  removeReleaseItem,
  ReleaseItemNotFoundError,
  ReleaseItemReferenceTakenError,
  ReleaseItemsLockedError,
} from "../src/server/services/release-items";
import { createRelease } from "../src/server/services/releases";

const workspaceId = "legacy-workspace";

async function main() {
  const db = getDb();
  const slug = `phase4-check-${Date.now()}`;
  let projectId: string | undefined;
  const releaseIds: string[] = [];

  try {
    assert.equal(releaseItemSchema.safeParse({ externalReference: "bad ref", title: "A", type: "TASK", status: "BLOCKED", notes: "" }).success, false);

    const project = await db.project.create({ data: { name: "Phase 4 Check", slug, workspaceId } });
    projectId = project.id;
    for (const version of ["v1.0.0", "v1.1.0"]) {
      const { release } = await createRelease(workspaceId, createReleaseSchema.parse({
        projectId,
        version,
        title: "Temporary release",
        description: "",
        targetDeploymentDate: "",
        rollbackNotes: "",
      }));
      releaseIds.push(release.id);
    }
    const [releaseId, otherReleaseId] = releaseIds;
    const input = releaseItemSchema.parse({
      externalReference: " nsc-482 ",
      title: "Prevent duplicate orders",
      type: ReleaseItemType.BUG,
      status: ReleaseItemStatus.QA_PENDING,
      notes: "Check retries",
    });
    const item = await addReleaseItem(workspaceId, releaseId, input);
    assert.equal(item.externalReference, "NSC-482");
    assert.equal(item.status, ReleaseItemStatus.QA_PENDING);

    await assert.rejects(() => addReleaseItem(workspaceId, releaseId, input), ReleaseItemReferenceTakenError);
    await addReleaseItem(workspaceId, otherReleaseId, input);
    const secondItem = await addReleaseItem(workspaceId, releaseId, {
      ...input,
      externalReference: "NSC-483",
      title: "Check order totals",
    });
    await assert.rejects(
      () => editReleaseItem(workspaceId, releaseId, secondItem.id, input),
      ReleaseItemReferenceTakenError,
    );

    const edited = { ...input, status: ReleaseItemStatus.READY, notes: null };
    await editReleaseItem(workspaceId, releaseId, item.id, edited);
    const saved = await db.release.findUnique({
      where: { id: releaseId },
      include: { items: true, checklistItems: true },
    });
    assert.equal(saved?.items.find((entry) => entry.id === item.id)?.status, ReleaseItemStatus.READY);
    assert.equal(saved?.items.find((entry) => entry.id === item.id)?.notes, null);
    assert.equal(calculateReleaseReadiness(saved!).readyItems, 1);

    await assert.rejects(() => editReleaseItem(workspaceId, otherReleaseId, item.id, edited), ReleaseItemNotFoundError);
    await assert.rejects(() => removeReleaseItem(workspaceId, otherReleaseId, item.id), ReleaseItemNotFoundError);

    await db.release.update({ where: { id: releaseId }, data: { status: ReleaseStatus.READY } });
    await assert.rejects(() => addReleaseItem(workspaceId, releaseId, input), ReleaseItemsLockedError);
    await assert.rejects(() => editReleaseItem(workspaceId, releaseId, item.id, edited), ReleaseItemsLockedError);
    await assert.rejects(() => removeReleaseItem(workspaceId, releaseId, item.id), ReleaseItemsLockedError);
    await db.release.update({ where: { id: releaseId }, data: { status: ReleaseStatus.DRAFT } });

    await removeReleaseItem(workspaceId, releaseId, item.id);
    assert.equal(await db.releaseItem.count({ where: { releaseId } }), 1);
  } finally {
    for (const releaseId of releaseIds) {
      await db.releaseItem.deleteMany({ where: { releaseId } });
      await db.releaseChecklistItem.deleteMany({ where: { releaseId } });
      await db.release.delete({ where: { id: releaseId } });
    }
    if (projectId) await db.project.delete({ where: { id: projectId } });
    await db.$disconnect();
  }

  console.log("Release item validation, CRUD, ownership, locking, and readiness passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
