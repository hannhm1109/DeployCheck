import "dotenv/config";
import assert from "node:assert/strict";
import { ChecklistKind, ReleaseStatus } from "../src/generated/prisma/enums";
import { calculateReleaseReadiness, REQUIRED_CHECKS } from "../src/lib/domain/releases/readiness";
import { checklistInputSchema } from "../src/lib/validation/checklist";
import { createReleaseSchema } from "../src/lib/validation/releases";
import { saveChecklistItemAction, saveRollbackPlanAction } from "../src/server/actions/checklist";
import { getDb } from "../src/server/db";
import { ChecklistLockedError, saveChecklistItem, saveRollbackPlan } from "../src/server/services/checklist";
import { createRelease } from "../src/server/services/releases";

async function main() {
  const db = getDb();
  const slug = `phase5-check-${Date.now()}`;
  let projectId: string | undefined;
  let releaseId: string | undefined;

  try {
    const invalid = new FormData();
    invalid.set("isComplete", "maybe");
    invalid.set("changeRequired", "sometimes");
    const emptyState = { values: { isComplete: false, changeRequired: "" as const, notes: "" }, errors: {} };
    const invalidResult = await saveChecklistItemAction("missing", ChecklistKind.DATABASE_MIGRATION_CHECKED, emptyState, invalid);
    assert.ok(invalidResult.errors.isComplete);
    assert.ok(invalidResult.errors.changeRequired);

    const project = await db.project.create({ data: { name: "Phase 5 Check", slug } });
    projectId = project.id;
    const { release } = await createRelease(createReleaseSchema.parse({
      projectId,
      version: "v1.0.0",
      title: "Temporary release",
      description: "",
      targetDeploymentDate: "",
      rollbackNotes: "",
    }));
    releaseId = release.id;
    const createdReleaseId = release.id;

    const initial = await db.release.findUnique({ where: { id: releaseId }, include: { items: true, checklistItems: true } });
    assert.equal(initial?.checklistItems.length, REQUIRED_CHECKS.length);
    assert.ok(calculateReleaseReadiness(initial!).blockers.some((blocker) => blocker.code === "ROLLBACK_PLAN_MISSING"));

    await db.releaseChecklistItem.delete({ where: { releaseId_kind: { releaseId, kind: ChecklistKind.QA_VALIDATED } } });
    const missing = await db.release.findUnique({ where: { id: releaseId }, include: { items: true, checklistItems: true } });
    assert.ok(calculateReleaseReadiness(missing!).blockers.some((blocker) => blocker.code === "CHECK_MISSING"));

    for (const kind of REQUIRED_CHECKS) {
      const input = checklistInputSchema.parse({
        kind,
        isComplete: "true",
        changeRequired: kind === ChecklistKind.QA_VALIDATED || kind === ChecklistKind.ROLLBACK_PLAN_DOCUMENTED ? "" : "false",
        notes: kind === ChecklistKind.QA_VALIDATED ? "QA signed off" : "",
      });
      await saveChecklistItem(releaseId, input);
    }
    const restored = await db.release.findUnique({ where: { id: releaseId }, include: { items: true, checklistItems: true } });
    assert.equal(restored?.checklistItems.length, REQUIRED_CHECKS.length);
    assert.equal(restored?.checklistItems.find((check) => check.kind === ChecklistKind.QA_VALIDATED)?.notes, "QA signed off");
    assert.equal(calculateReleaseReadiness(restored!).completedChecks, REQUIRED_CHECKS.length);
    assert.deepEqual(calculateReleaseReadiness(restored!).blockers.map((blocker) => blocker.code), ["ROLLBACK_PLAN_MISSING"]);

    await saveRollbackPlan(releaseId, "Restore the previous image.");
    const ready = await db.release.findUnique({ where: { id: releaseId }, include: { items: true, checklistItems: true } });
    assert.equal(calculateReleaseReadiness(ready!).isReady, true);

    await saveChecklistItem(releaseId, checklistInputSchema.parse({
      kind: ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED,
      isComplete: "true",
      changeRequired: "",
      notes: "Awaiting confirmation",
    }));
    const undecided = await db.release.findUnique({ where: { id: releaseId }, include: { items: true, checklistItems: true } });
    assert.ok(calculateReleaseReadiness(undecided!).blockers.some((blocker) => blocker.code === "CHANGE_REQUIREMENT_UNKNOWN"));

    await db.release.update({ where: { id: releaseId }, data: { status: ReleaseStatus.READY } });
    await assert.rejects(() => saveChecklistItem(createdReleaseId, checklistInputSchema.parse({
      kind: ChecklistKind.QA_VALIDATED,
      isComplete: "false",
      changeRequired: "",
      notes: "",
    })), ChecklistLockedError);
    await assert.rejects(() => saveRollbackPlan(createdReleaseId, null), ChecklistLockedError);
    const lockedPlan = new FormData();
    lockedPlan.set("rollbackNotes", "Change after ready");
    const lockedResult = await saveRollbackPlanAction(releaseId, { value: "" }, lockedPlan);
    assert.match(lockedResult.error ?? "", /Draft or In review/);
  } finally {
    if (releaseId) {
      await db.releaseChecklistItem.deleteMany({ where: { releaseId } });
      await db.release.delete({ where: { id: releaseId } });
    }
    if (projectId) await db.project.delete({ where: { id: projectId } });
    await db.$disconnect();
  }

  console.log("Checklist persistence, blockers, rollback plan, and locking passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
