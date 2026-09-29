import type { CreateProjectInput } from "@/lib/validation/projects";
import { getDb } from "@/server/db";

export function listProjects() {
  return getDb().project.findMany({
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

export function getProjectBySlug(slug: string) {
  return getDb().project.findUnique({
    where: { slug },
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

export function getProjectForRelease(id: string) {
  return getDb().project.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
}

export function listProjectOptions() {
  return getDb().project.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

export function insertProject(input: CreateProjectInput) {
  return getDb().project.create({ data: input });
}
