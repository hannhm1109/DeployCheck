import {
  ChecklistKind,
  ReleaseItemStatus,
} from "../../../generated/prisma/enums";

export const REQUIRED_CHECKS = [
  ChecklistKind.QA_VALIDATED,
  ChecklistKind.DATABASE_MIGRATION_CHECKED,
  ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED,
  ChecklistKind.BACKGROUND_JOBS_CHECKED,
  ChecklistKind.ROLLBACK_PLAN_DOCUMENTED,
] as const;

export const CHECK_LABELS: Record<ChecklistKind, string> = {
  QA_VALIDATED: "QA validation",
  DATABASE_MIGRATION_CHECKED: "Database migration check",
  ENVIRONMENT_VARIABLES_CHECKED: "Environment variable check",
  BACKGROUND_JOBS_CHECKED: "Background job check",
  ROLLBACK_PLAN_DOCUMENTED: "Rollback plan check",
};

const CHANGE_CHECKS = new Set<ChecklistKind>([
  ChecklistKind.DATABASE_MIGRATION_CHECKED,
  ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED,
  ChecklistKind.BACKGROUND_JOBS_CHECKED,
]);

export function requiresChangeDecision(kind: ChecklistKind): boolean {
  return CHANGE_CHECKS.has(kind);
}

export type ReleaseReadinessInput = {
  items: readonly {
    externalReference: string;
    status: ReleaseItemStatus;
  }[];
  checklistItems: readonly {
    kind: ChecklistKind;
    isComplete: boolean;
    changeRequired: boolean | null;
  }[];
  rollbackNotes: string | null;
};

export type ReleaseBlocker =
  | { code: "CHECK_MISSING" | "CHECK_INCOMPLETE" | "CHANGE_REQUIREMENT_UNKNOWN"; kind: ChecklistKind; message: string }
  | { code: "ROLLBACK_PLAN_MISSING"; message: string }
  | { code: "ITEM_NOT_READY"; reference: string; status: ReleaseItemStatus; message: string };

export function getReleaseBlockers(
  release: ReleaseReadinessInput,
): ReleaseBlocker[] {
  const checks = new Map(release.checklistItems.map((check) => [check.kind, check]));
  const blockers: ReleaseBlocker[] = [];

  for (const kind of REQUIRED_CHECKS) {
    const check = checks.get(kind);

    if (!check) {
      blockers.push({
        code: "CHECK_MISSING",
        kind,
        message: `${CHECK_LABELS[kind]} is missing`,
      });
      continue;
    }

    if (!check.isComplete) {
      blockers.push({
        code: "CHECK_INCOMPLETE",
        kind,
        message: `${CHECK_LABELS[kind]} is incomplete`,
      });
    }

    if (requiresChangeDecision(kind) && check.changeRequired === null) {
      blockers.push({
        code: "CHANGE_REQUIREMENT_UNKNOWN",
        kind,
        message: `${CHECK_LABELS[kind]} has no change decision`,
      });
    }
  }

  if (!release.rollbackNotes?.trim()) {
    blockers.push({
      code: "ROLLBACK_PLAN_MISSING",
      message: "Rollback plan is missing",
    });
  }

  for (const item of release.items) {
    if (item.status !== ReleaseItemStatus.READY) {
      blockers.push({
        code: "ITEM_NOT_READY",
        reference: item.externalReference,
        status: item.status,
        message: `${item.externalReference} is not ready (${item.status})`,
      });
    }
  }

  return blockers;
}

export function calculateReleaseReadiness(release: ReleaseReadinessInput) {
  const checks = new Map(release.checklistItems.map((check) => [check.kind, check]));
  const blockers = getReleaseBlockers(release);

  return {
    isReady: blockers.length === 0,
    completedChecks: REQUIRED_CHECKS.filter((kind) => checks.get(kind)?.isComplete)
      .length,
    totalChecks: REQUIRED_CHECKS.length,
    readyItems: release.items.filter(
      (item) => item.status === ReleaseItemStatus.READY,
    ).length,
    totalItems: release.items.length,
    blockers,
  };
}
