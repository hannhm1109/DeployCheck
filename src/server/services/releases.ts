import { Prisma } from "@/generated/prisma/client";
import { REQUIRED_CHECKS } from "@/lib/domain/releases/readiness";
import type { CreateReleaseInput } from "@/lib/validation/releases";
import { getProjectForRelease } from "@/server/data/projects";
import { insertRelease } from "@/server/data/releases";
import { assertDemoWritable } from "@/server/demo-access";

export class ReleaseVersionTakenError extends Error {
  constructor() {
    super("This version already exists in the selected project.");
  }
}

export class ReleaseProjectNotFoundError extends Error {
  constructor() {
    super("The selected project no longer exists.");
  }
}

export async function createRelease(input: CreateReleaseInput) {
  assertDemoWritable();
  const project = await getProjectForRelease(input.projectId);
  if (!project) throw new ReleaseProjectNotFoundError();

  try {
    const release = await insertRelease(input, REQUIRED_CHECKS);
    return { release, projectSlug: project.slug };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new ReleaseVersionTakenError();
      if (error.code === "P2003") throw new ReleaseProjectNotFoundError();
    }
    throw error;
  }
}
