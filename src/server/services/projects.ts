import { Prisma } from "@/generated/prisma/client";
import type { CreateProjectInput } from "@/lib/validation/projects";
import { insertProject } from "@/server/data/projects";
import { assertDemoWritable } from "@/server/demo-access";

export class ProjectSlugTakenError extends Error {
  constructor() {
    super("A project with this slug already exists.");
  }
}

export async function createProject(input: CreateProjectInput) {
  assertDemoWritable();
  try {
    return await insertProject(input);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ProjectSlugTakenError();
    }
    throw error;
  }
}
