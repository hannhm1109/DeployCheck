import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  ChecklistKind,
  DeploymentResult,
  ReleaseItemStatus,
  ReleaseItemType,
  ReleaseStatus,
} from "../src/generated/prisma/enums";

type SeedItem = {
  externalReference: string;
  title: string;
  type: ReleaseItemType;
  status: ReleaseItemStatus;
};

type SeedCheck = {
  kind: ChecklistKind;
  isComplete: boolean;
  changeRequired: boolean | null;
  notes?: string;
};

type SeedDeployment = {
  id: string;
  occurredAt: Date;
  result: DeploymentResult;
  notes?: string;
};

type SeedRelease = {
  projectSlug: string;
  version: string;
  title: string;
  description: string;
  status: ReleaseStatus;
  targetDeploymentDate: Date;
  deployedAt: Date | null;
  rollbackNotes: string;
  items: SeedItem[];
  checks: SeedCheck[];
  deployments: SeedDeployment[];
};

const completedChecks: SeedCheck[] = [
  { kind: ChecklistKind.QA_VALIDATED, isComplete: true, changeRequired: null },
  {
    kind: ChecklistKind.DATABASE_MIGRATION_CHECKED,
    isComplete: true,
    changeRequired: false,
  },
  {
    kind: ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED,
    isComplete: true,
    changeRequired: false,
  },
  {
    kind: ChecklistKind.BACKGROUND_JOBS_CHECKED,
    isComplete: true,
    changeRequired: false,
  },
  {
    kind: ChecklistKind.ROLLBACK_PLAN_DOCUMENTED,
    isComplete: true,
    changeRequired: null,
  },
];

const releases: SeedRelease[] = [
  {
    projectSlug: "northstar-commerce",
    version: "v3.4.0",
    title: "Checkout reliability",
    description: "Payment and catalog fixes for the autumn release.",
    status: ReleaseStatus.IN_REVIEW,
    targetDeploymentDate: new Date("2026-10-03T00:00:00.000Z"),
    deployedAt: null,
    rollbackNotes: "Redeploy v3.3.5 and disable the new checkout flag.",
    items: [
      {
        externalReference: "NSC-482",
        title: "Prevent duplicate orders during payment retries",
        type: ReleaseItemType.BUG,
        status: ReleaseItemStatus.QA_PENDING,
      },
      {
        externalReference: "NSC-491",
        title: "Connect the new product landing page",
        type: ReleaseItemType.FEATURE,
        status: ReleaseItemStatus.READY,
      },
      {
        externalReference: "NSC-503",
        title: "Correct equivalent product sorting",
        type: ReleaseItemType.BUG,
        status: ReleaseItemStatus.READY,
      },
    ],
    checks: completedChecks.map((check) => {
      if (check.kind === ChecklistKind.QA_VALIDATED) {
        return { ...check, isComplete: false };
      }
      if (check.kind === ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED) {
        return { ...check, isComplete: false, changeRequired: null };
      }
      return check;
    }),
    deployments: [],
  },
  {
    projectSlug: "northstar-commerce",
    version: "v3.3.5",
    title: "Order confirmation fixes",
    description: "Stabilizes confirmation emails and order totals.",
    status: ReleaseStatus.DEPLOYED,
    targetDeploymentDate: new Date("2026-09-18T00:00:00.000Z"),
    deployedAt: new Date("2026-09-18T14:20:00.000Z"),
    rollbackNotes: "Redeploy v3.3.4 and reprocess queued confirmation emails.",
    items: [
      {
        externalReference: "NSC-461",
        title: "Fix order confirmation email retries",
        type: ReleaseItemType.BUG,
        status: ReleaseItemStatus.READY,
      },
    ],
    checks: completedChecks,
    deployments: [
      {
        id: "seed-northstar-v335-deployment",
        occurredAt: new Date("2026-09-18T14:20:00.000Z"),
        result: DeploymentResult.SUCCEEDED,
        notes: "Production smoke checks passed.",
      },
    ],
  },
  {
    projectSlug: "harbor-api",
    version: "v2.0.0",
    title: "API request limits",
    description: "Adds per-client limits and request tracing.",
    status: ReleaseStatus.READY,
    targetDeploymentDate: new Date("2026-10-05T00:00:00.000Z"),
    deployedAt: null,
    rollbackNotes: "Restore v1.9.1 and turn off the rate-limit flag.",
    items: [
      {
        externalReference: "HBR-210",
        title: "Apply per-client request limits",
        type: ReleaseItemType.FEATURE,
        status: ReleaseItemStatus.READY,
      },
      {
        externalReference: "HBR-216",
        title: "Add request tracing to worker jobs",
        type: ReleaseItemType.TECHNICAL,
        status: ReleaseItemStatus.READY,
      },
    ],
    checks: completedChecks.map((check) =>
      check.kind === ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED
        ? { ...check, changeRequired: true, notes: "Set the rate-limit flag." }
        : check,
    ),
    deployments: [],
  },
  {
    projectSlug: "harbor-api",
    version: "v1.9.2",
    title: "Queue worker update",
    description: "A worker change that was rolled back after deployment failed.",
    status: ReleaseStatus.ROLLED_BACK,
    targetDeploymentDate: new Date("2026-09-11T00:00:00.000Z"),
    deployedAt: null,
    rollbackNotes: "Restore the previous worker image and drain the retry queue.",
    items: [
      {
        externalReference: "HBR-197",
        title: "Reduce duplicate queue processing",
        type: ReleaseItemType.BUG,
        status: ReleaseItemStatus.READY,
      },
    ],
    checks: completedChecks,
    deployments: [
      {
        id: "seed-harbor-v192-failure",
        occurredAt: new Date("2026-09-11T10:15:00.000Z"),
        result: DeploymentResult.FAILED,
        notes: "Worker health checks failed after rollout.",
      },
      {
        id: "seed-harbor-v192-rollback",
        occurredAt: new Date("2026-09-11T10:32:00.000Z"),
        result: DeploymentResult.ROLLED_BACK,
        notes: "Previous worker image restored.",
      },
    ],
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed the database");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    await prisma.$transaction(async (tx) => {
      const projectIds = new Map<string, string>();

      for (const project of [
        {
          slug: "northstar-commerce",
          name: "Northstar Commerce",
          description: "A fictional online storefront and checkout platform.",
        },
        {
          slug: "harbor-api",
          name: "Harbor API",
          description: "A fictional API and background processing service.",
        },
      ]) {
        const saved = await tx.project.upsert({
          where: { slug: project.slug },
          update: {},
          create: project,
        });
        projectIds.set(project.slug, saved.id);
      }

      for (const seed of releases) {
        const projectId = projectIds.get(seed.projectSlug);
        if (!projectId) {
          throw new Error(`Unknown seed project: ${seed.projectSlug}`);
        }

        const release = await tx.release.upsert({
          where: { projectId_version: { projectId, version: seed.version } },
          update: {},
          create: {
            projectId,
            version: seed.version,
            title: seed.title,
            description: seed.description,
            status: seed.status,
            targetDeploymentDate: seed.targetDeploymentDate,
            deployedAt: seed.deployedAt,
            rollbackNotes: seed.rollbackNotes,
          },
        });

        await tx.releaseItem.createMany({
          data: seed.items.map((item) => ({ releaseId: release.id, ...item })),
          skipDuplicates: true,
        });
        await tx.releaseChecklistItem.createMany({
          data: seed.checks.map((check) => ({ releaseId: release.id, ...check })),
          skipDuplicates: true,
        });
        await tx.deployment.createMany({
          data: seed.deployments.map((deployment) => ({
            releaseId: release.id,
            ...deployment,
          })),
          skipDuplicates: true,
        });
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
