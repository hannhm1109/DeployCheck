import "dotenv/config";
import assert from "node:assert/strict";
import { ReleaseItemStatus, ReleaseItemType, ReleaseStatus } from "../src/generated/prisma/enums";
import { calculateReleaseReadiness } from "../src/lib/domain/releases/readiness";
import { releaseItemSchema } from "../src/lib/validation/release-items";
import { createReleaseSchema } from "../src/lib/validation/releases";
import { addReleaseItemAction } from "../src/server/actions/release-items";
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

async function main() {
  const db = getDb();
  const slug = `phase4-check-${Date.now()}`;
  let projectId: string | undefined;
  const releaseIds: string[] = [];

  try {
    const invalid = new FormData();
    invalid.set("externalReference", "bad ref");
    invalid.set("title", "A");
    invalid.set("type", "TASK");
    invalid.set("status", "BLOCKED");
    const emptyState = {
      values: { externalReference: "", title: "", type: "", status: "", notes: "" },
      errors: {},
    };
    const invalidResult = await addReleaseItemAction("missing", emptyState, invalid);
    assert.ok(invalidResult.errors.externalReference);
    assert.ok(invalidResult.errors.title);
    assert.ok(invalidResult.errors.type);
    assert.ok(invalidResult.errors.status);

    const project = await db.project.create({ data: { name: "Phase 4 Check", slug } });
    projectId = project.id;
    for (const version of ["v1.0.0", "v1.1.0"]) {
      const { release } = await createRelease(createReleaseSchema.parse({
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
    const item = await addReleaseItem(releaseId, input);
    assert.equal(item.externalReference, "NSC-482");
    assert.equal(item.status, ReleaseItemStatus.QA_PENDING);

    const duplicate = new FormData();
    duplicate.set("externalReference", "nsc-482");
    duplicate.set("title", "Duplicate reference");
    duplicate.set("type", ReleaseItemType.BUG);
    duplicate.set("status", ReleaseItemStatus.TODO);
    const duplicateResult = await addReleaseItemAction(releaseId, emptyState, duplicate);
    assert.equal(duplicateResult.errors.externalReference, "This reference already exists in the release.");
    await assert.rejects(() => addReleaseItem(releaseId, input), ReleaseItemReferenceTakenError);
    await addReleaseItem(otherReleaseId, input);
    const secondItem = await addReleaseItem(releaseId, {
      ...input,
      externalReference: "NSC-483",
      title: "Check order totals",
    });
    await assert.rejects(
      () => editReleaseItem(releaseId, secondItem.id, input),
      ReleaseItemReferenceTakenError,
    );

    const edited = { ...input, status: ReleaseItemStatus.READY, notes: null };
    await editReleaseItem(releaseId, item.id, edited);
    const saved = await db.release.findUnique({
      where: { id: releaseId },
      include: { items: true, checklistItems: true },
    });
    assert.equal(saved?.items.find((entry) => entry.id === item.id)?.status, ReleaseItemStatus.READY);
    assert.equal(saved?.items.find((entry) => entry.id === item.id)?.notes, null);
    assert.equal(calculateReleaseReadiness(saved!).readyItems, 1);

    await assert.rejects(() => editReleaseItem(otherReleaseId, item.id, edited), ReleaseItemNotFoundError);
    await assert.rejects(() => removeReleaseItem(otherReleaseId, item.id), ReleaseItemNotFoundError);

    await db.release.update({ where: { id: releaseId }, data: { status: ReleaseStatus.READY } });
    await assert.rejects(() => addReleaseItem(releaseId, input), ReleaseItemsLockedError);
    await assert.rejects(() => editReleaseItem(releaseId, item.id, edited), ReleaseItemsLockedError);
    await assert.rejects(() => removeReleaseItem(releaseId, item.id), ReleaseItemsLockedError);
    await db.release.update({ where: { id: releaseId }, data: { status: ReleaseStatus.DRAFT } });

    await removeReleaseItem(releaseId, item.id);
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
