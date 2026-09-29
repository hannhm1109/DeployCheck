import "dotenv/config";
import assert from "node:assert/strict";
import { ChecklistKind, DeploymentResult, ReleaseStatus } from "../src/generated/prisma/enums";
import { REQUIRED_CHECKS } from "../src/lib/domain/releases/readiness";
import { getDb } from "../src/server/db";
import { listDeploymentHistory } from "../src/server/data/deployments";
import { getOverview } from "../src/server/data/overview";

async function main() {
  const db = getDb();
  const now = new Date();
  const baseline = await getOverview(now);
  const slug = `phase7-check-${Date.now()}`;
  let projectId: string | undefined;

  try {
    const project = await db.project.create({ data: { name: "Phase 7 Check", slug } });
    projectId = project.id;
    const targetDeploymentDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7));
    const ready = await db.release.create({
      data: {
        projectId, version: "v1.0.0", title: "Ready fixture",
        status: ReleaseStatus.READY, targetDeploymentDate,
        rollbackNotes: "Restore the previous image.",
        checklistItems: {
          create: REQUIRED_CHECKS.map((kind) => ({
            kind,
            isComplete: true,
            changeRequired: kind === ChecklistKind.QA_VALIDATED || kind === ChecklistKind.ROLLBACK_PLAN_DOCUMENTED ? null : false,
          })),
        },
      },
    });
    await db.release.create({
      data: { projectId, version: "v1.0.1", title: "Incomplete ready fixture", status: ReleaseStatus.READY },
    });
    const attempt = await db.release.create({
      data: { projectId, version: "v1.1.0", title: "Attempt fixture", status: ReleaseStatus.ROLLED_BACK },
    });
    await db.deployment.createMany({
      data: Array.from({ length: 22 }, (_, index) => ({
        releaseId: attempt.id,
        result: index % 2 ? DeploymentResult.FAILED : DeploymentResult.ROLLED_BACK,
        notes: `Attempt ${index + 1}`,
        occurredAt: new Date(now.getTime() - (index + 1) * 60_000),
      })),
    });

    const overview = await getOverview(now);
    assert.equal(overview.projectCount, baseline.projectCount + 1);
    assert.equal(overview.upcomingCount, baseline.upcomingCount + 1);
    assert.equal(overview.readyCount, baseline.readyCount + 1);
    assert.equal(overview.recentDeploymentCount, baseline.recentDeploymentCount + 22);
    assert.ok(overview.recentReleases.some((release) => release.id === ready.id));
    assert.equal(overview.recentDeployments.length, 5);

    const first = await listDeploymentHistory({ releaseId: attempt.id });
    const second = await listDeploymentHistory({ releaseId: attempt.id, page: 2 });
    assert.equal(first.total, 22);
    assert.equal(first.pageCount, 2);
    assert.equal(first.deployments.length, 20);
    assert.equal(second.deployments.length, 2);
    const overflow = await listDeploymentHistory({ releaseId: attempt.id, page: 999 });
    assert.equal(overflow.page, 2);
    assert.equal(overflow.deployments.length, 2);
    assert.ok(first.deployments[0].occurredAt > second.deployments[0].occurredAt);
    const failed = await listDeploymentHistory({ releaseId: attempt.id, result: DeploymentResult.FAILED });
    assert.equal(failed.total, 11);
    assert.ok(failed.deployments.every((entry) => entry.result === DeploymentResult.FAILED));
    const empty = await listDeploymentHistory({ releaseId: ready.id });
    assert.equal(empty.total, 0);
    console.log("Phase 7 overview and deployment history smoke checks passed.");
  } finally {
    if (projectId) {
      const releases = await db.release.findMany({ where: { projectId }, select: { id: true } });
      const releaseIds = releases.map((release) => release.id);
      await db.deployment.deleteMany({ where: { releaseId: { in: releaseIds } } });
      await db.releaseChecklistItem.deleteMany({ where: { releaseId: { in: releaseIds } } });
      await db.release.deleteMany({ where: { projectId } });
      await db.project.delete({ where: { id: projectId } });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
