import { ChecklistKind, ReleaseItemStatus } from "@/generated/prisma/enums";

export const checkKeys = {
  [ChecklistKind.QA_VALIDATED]: "qa",
  [ChecklistKind.DATABASE_MIGRATION_CHECKED]: "migration",
  [ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED]: "environment",
  [ChecklistKind.BACKGROUND_JOBS_CHECKED]: "jobs",
  [ChecklistKind.ROLLBACK_PLAN_DOCUMENTED]: "rollback",
} as const;

export const itemStatusKeys = {
  [ReleaseItemStatus.TODO]: "todo",
  [ReleaseItemStatus.IN_PROGRESS]: "inProgress",
  [ReleaseItemStatus.QA_PENDING]: "qaPending",
  [ReleaseItemStatus.READY]: "ready",
} as const;
