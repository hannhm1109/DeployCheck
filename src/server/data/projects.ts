import type { CreateProjectInput } from "@/lib/validation/projects";
import { getDb } from "@/server/db";

export function listProjects(workspaceId: string) {
  return getDb().project.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { releases: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
  });
}

export function getProjectBySlug(workspaceId: string, slug: string) {
  return getDb().project.findUnique({
    where: { workspaceId_slug: { workspaceId, slug } },
    include: {
      releases: {
        select: {
          id: true,
          version: true,
          title: true,
          status: true,
          targetDeploymentDate: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export function getProjectForRelease(workspaceId: string, id: string) {
  return getDb().project.findFirst({
    where: { id, workspaceId },
    select: { id: true, slug: true },
  });
}

export function listProjectOptions(workspaceId: string) {
  return getDb().project.findMany({
    where: { workspaceId },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

export function insertProject(workspaceId: string, input: CreateProjectInput) {
  return getDb().project.create({ data: { ...input, workspaceId } });
}
