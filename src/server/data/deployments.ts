import type { DeploymentResult } from "@/generated/prisma/enums";
import { getDb } from "@/server/db";

const PAGE_SIZE = 20;

export async function listDeploymentHistory(workspaceId: string, {
  page = 1,
  result,
  releaseId,
}: {
  page?: number;
  result?: DeploymentResult;
  releaseId?: string;
} = {}) {
  const db = getDb();
  const where = {
    release: { project: { workspaceId } },
    ...(result ? { result } : {}),
    ...(releaseId ? { releaseId } : {}),
  };
  const total = await db.deployment.count({ where });
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.min(Math.max(1, Math.floor(page)), Math.max(1, pageCount));
  const deployments = await db.deployment.findMany({
    where,
    select: {
      id: true, occurredAt: true, result: true, notes: true,
      release: { select: { id: true, version: true, title: true, project: { select: { name: true } } } },
    },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return { deployments, total, pageCount, page: currentPage };
}
