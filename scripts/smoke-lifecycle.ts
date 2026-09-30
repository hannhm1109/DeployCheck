import "dotenv/config";
import assert from "node:assert/strict";
import { ChecklistKind, DeploymentResult, ReleaseStatus } from "../src/generated/prisma/enums";
import { REQUIRED_CHECKS } from "../src/lib/domain/releases/readiness";
import { checklistInputSchema } from "../src/lib/validation/checklist";
import { createReleaseSchema } from "../src/lib/validation/releases";
import { transitionInputSchema } from "../src/lib/validation/lifecycle";
import { getDb } from "../src/server/db";
import { saveChecklistItem as saveChecklistItemForWorkspace, saveRollbackPlan as saveRollbackPlanForWorkspace } from "../src/server/services/checklist";
import { createRelease as createReleaseForWorkspace } from "../src/server/services/releases";
import {
  ReleaseTransitionRejectedError,
  transitionReleaseStatus as transitionReleaseStatusForWorkspace,
} from "../src/server/services/lifecycle";

const workspaceId = "legacy-workspace";
const createRelease = (input: Parameters<typeof createReleaseForWorkspace>[1]) => createReleaseForWorkspace(workspaceId, input);
const saveChecklistItem = (releaseId: string, input: Parameters<typeof saveChecklistItemForWorkspace>[2]) => saveChecklistItemForWorkspace(workspaceId, releaseId, input);
const saveRollbackPlan = (releaseId: string, notes: string | null) => saveRollbackPlanForWorkspace(workspaceId, releaseId, notes);
const transitionReleaseStatus = (releaseId: string, input: Parameters<typeof transitionReleaseStatusForWorkspace>[2]) => transitionReleaseStatusForWorkspace(workspaceId, releaseId, input);

async function main() {
  const db = getDb();
  const slug = `phase6-check-${Date.now()}`;
  let projectId: string | undefined;
  const releaseIds: string[] = [];

  async function createTestRelease(version: string) {
    const { release } = await createRelease(createReleaseSchema.parse({
      projectId,
      version,
      title: "Lifecycle check",
      description: "",
      targetDeploymentDate: "",
      rollbackNotes: "",
    }));
    releaseIds.push(release.id);
    return release.id;
  }

  async function makeReady(releaseId: string) {
    for (const kind of REQUIRED_CHECKS) {
      await saveChecklistItem(releaseId, checklistInputSchema.parse({
        kind,
        isComplete: "true",
        changeRequired: kind === ChecklistKind.QA_VALIDATED || kind === ChecklistKind.ROLLBACK_PLAN_DOCUMENTED ? "" : "false",
        notes: "",
      }));
    }
    await saveRollbackPlan(releaseId, "Redeploy the previous image.");
  }

  function input(nextStatus: ReleaseStatus, notes = "") {
    return transitionInputSchema.parse({ nextStatus, notes });
  }

  try {
    assert.equal(transitionInputSchema.safeParse({ nextStatus: "PUBLISHED", notes: "" }).success, false);

    const project = await db.project.create({ data: { name: "Phase 6 Check", slug, workspaceId } });
    projectId = project.id;

    const successId = await createTestRelease("v1.0.0");
    await assert.rejects(
      () => transitionReleaseStatus(successId, input(ReleaseStatus.READY)),
      ReleaseTransitionRejectedError,
    );
    await transitionReleaseStatus(successId, input(ReleaseStatus.IN_REVIEW));
    await assert.rejects(
      () => transitionReleaseStatus(successId, input(ReleaseStatus.READY)),
      ReleaseTransitionRejectedError,
    );
    await makeReady(successId);
    await transitionReleaseStatus(successId, input(ReleaseStatus.READY));
    await transitionReleaseStatus(successId, input(ReleaseStatus.DEPLOYING));
    await transitionReleaseStatus(successId, input(ReleaseStatus.DEPLOYED, "Production smoke checks passed."));
    const deployed = await db.release.findUnique({ where: { id: successId }, include: { deployments: true } });
    assert.equal(deployed?.status, ReleaseStatus.DEPLOYED);
    assert.ok(deployed?.deployedAt);
    assert.equal(deployed.deployments.length, 1);
    assert.equal(deployed.deployments[0].result, DeploymentResult.SUCCEEDED);
    assert.equal(deployed.deployments[0].notes, "Production smoke checks passed.");
    assert.equal(deployed.deployments[0].occurredAt.toISOString(), deployed.deployedAt.toISOString());
    await transitionReleaseStatus(successId, input(ReleaseStatus.ROLLED_BACK, "Previous image restored."));
    const rolledBackSuccess = await db.release.findUnique({ where: { id: successId }, include: { deployments: true } });
    assert.equal(rolledBackSuccess?.status, ReleaseStatus.ROLLED_BACK);
    assert.equal(rolledBackSuccess?.deployments.length, 2);
    assert.ok(rolledBackSuccess?.deployments.some((entry) => entry.result === DeploymentResult.ROLLED_BACK));
    assert.ok(rolledBackSuccess?.deployedAt);

    const failureId = await createTestRelease("v1.1.0");
    await transitionReleaseStatus(failureId, input(ReleaseStatus.IN_REVIEW));
    await makeReady(failureId);
    await transitionReleaseStatus(failureId, input(ReleaseStatus.READY));
    await transitionReleaseStatus(failureId, input(ReleaseStatus.DEPLOYING));
    await transitionReleaseStatus(failureId, input(ReleaseStatus.FAILED, "Health checks failed."));
    const failed = await db.release.findUnique({ where: { id: failureId }, include: { deployments: true } });
    assert.equal(failed?.status, ReleaseStatus.FAILED);
    assert.equal(failed?.deployedAt, null);
    assert.equal(failed?.deployments[0].result, DeploymentResult.FAILED);
    await transitionReleaseStatus(failureId, input(ReleaseStatus.ROLLED_BACK, "Worker restored."));
    const rolledBackFailure = await db.release.findUnique({ where: { id: failureId }, include: { deployments: true } });
    assert.equal(rolledBackFailure?.status, ReleaseStatus.ROLLED_BACK);
    assert.equal(rolledBackFailure?.deployments.length, 2);

    const concurrentId = await createTestRelease("v1.2.0");
    await transitionReleaseStatus(concurrentId, input(ReleaseStatus.IN_REVIEW));
    await makeReady(concurrentId);
    const concurrent = await Promise.allSettled([
      transitionReleaseStatus(concurrentId, input(ReleaseStatus.READY)),
      transitionReleaseStatus(concurrentId, input(ReleaseStatus.DRAFT)),
    ]);
    assert.equal(concurrent.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(concurrent.filter((result) => result.status === "rejected").length, 1);
    assert.equal(await db.deployment.count({ where: { releaseId: concurrentId } }), 0);

    const contentRaceId = await createTestRelease("v1.3.0");
    await transitionReleaseStatus(contentRaceId, input(ReleaseStatus.IN_REVIEW));
    await makeReady(contentRaceId);
    await Promise.allSettled([
      transitionReleaseStatus(contentRaceId, input(ReleaseStatus.READY)),
      saveChecklistItem(contentRaceId, checklistInputSchema.parse({
        kind: ChecklistKind.QA_VALIDATED,
        isComplete: "false",
        changeRequired: "",
        notes: "QA found an issue",
      })),
    ]);
    const raced = await db.release.findUnique({
      where: { id: contentRaceId },
      include: { items: true, checklistItems: true },
    });
    assert.ok(raced);
    assert.ok(raced.status !== ReleaseStatus.READY || raced.checklistItems.find(
      (check) => check.kind === ChecklistKind.QA_VALIDATED,
    )?.isComplete);
  } finally {
    for (const releaseId of releaseIds) {
      await db.deployment.deleteMany({ where: { releaseId } });
      await db.releaseItem.deleteMany({ where: { releaseId } });
      await db.releaseChecklistItem.deleteMany({ where: { releaseId } });
      await db.release.delete({ where: { id: releaseId } });
    }
    if (projectId) await db.project.delete({ where: { id: projectId } });
    await db.$disconnect();
  }

  console.log("Lifecycle transitions, deployment outcomes, rollback, and concurrency passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
