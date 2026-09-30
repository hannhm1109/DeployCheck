import { ReleaseStatus } from "@/generated/prisma/enums";
import { calculateReleaseReadiness } from "@/lib/domain/releases/readiness";
import { getDb } from "@/server/db";

export async function getOverview(workspaceId: string, now = new Date()) {
  const db = getDb();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [projectCount, upcomingCount, recentDeploymentCount, readyReleases, recentReleases, recentDeployments] = await Promise.all([
    db.project.count({ where: { workspaceId } }),
    db.release.count({
      where: {
        project: { workspaceId },
        targetDeploymentDate: { gte: today },
        status: { in: [ReleaseStatus.DRAFT, ReleaseStatus.IN_REVIEW, ReleaseStatus.READY, ReleaseStatus.DEPLOYING] },
      },
    }),
    db.deployment.count({ where: { release: { project: { workspaceId } }, occurredAt: { gte: thirtyDaysAgo, lte: now } } }),
    db.release.findMany({
      where: { project: { workspaceId }, status: ReleaseStatus.READY },
      select: {
        id: true,
        rollbackNotes: true,
        items: { select: { externalReference: true, status: true } },
        checklistItems: { select: { kind: true, isComplete: true, changeRequired: true } },
      },
    }),
    db.release.findMany({
      where: { project: { workspaceId } },
      select: {
        id: true, version: true, title: true, status: true, targetDeploymentDate: true,
        project: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
    }),
    db.deployment.findMany({
      where: { release: { project: { workspaceId } } },
      select: {
        id: true, occurredAt: true, result: true,
        release: { select: { id: true, version: true, project: { select: { name: true } } } },
      },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: 5,
    }),
  ]);

  return {
    projectCount,
    upcomingCount,
    readyCount: readyReleases.filter((release) => calculateReleaseReadiness(release).isReady).length,
    recentDeploymentCount,
    recentReleases,
    recentDeployments,
  };
}
