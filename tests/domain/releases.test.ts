import { describe, expect, it } from "vitest";
import {
  ChecklistKind,
  ReleaseItemStatus,
  ReleaseStatus,
} from "../../src/generated/prisma/enums";
import {
  calculateReleaseReadiness,
  getReleaseBlockers,
  REQUIRED_CHECKS,
  type ReleaseReadinessInput,
} from "../../src/lib/domain/releases/readiness";
import {
  canTransitionReleaseStatus,
  getNextReleaseStatuses,
  getTransitionError,
} from "../../src/lib/domain/releases/transitions";

function readyRelease(): ReleaseReadinessInput {
  return {
    items: [{ externalReference: "NSC-482", status: ReleaseItemStatus.READY }],
    checklistItems: REQUIRED_CHECKS.map((kind) => ({
      kind,
      isComplete: true,
      changeRequired:
        kind === ChecklistKind.QA_VALIDATED ||
        kind === ChecklistKind.ROLLBACK_PLAN_DOCUMENTED
          ? null
          : false,
    })),
    rollbackNotes: "Restore the previous version.",
  };
}

describe("release readiness", () => {
  it("is ready when all required checks and items are ready", () => {
    expect(calculateReleaseReadiness(readyRelease())).toEqual({
      isReady: true,
      completedChecks: 5,
      totalChecks: 5,
      readyItems: 1,
      totalItems: 1,
      blockers: [],
    });
  });

  it("blocks a missing required check", () => {
    const release = readyRelease();
    release.checklistItems = release.checklistItems.filter(
      (check) => check.kind !== ChecklistKind.QA_VALIDATED,
    );

    expect(getReleaseBlockers(release)).toContainEqual({
      code: "CHECK_MISSING",
      message: "QA validation is missing",
    });
  });

  it("reports incomplete checks, undecided changes, tickets, and a missing plan", () => {
    const release = readyRelease();
    release.items = [
      { externalReference: "NSC-482", status: ReleaseItemStatus.QA_PENDING },
    ];
    release.checklistItems = release.checklistItems.map((check) =>
      check.kind === ChecklistKind.ENVIRONMENT_VARIABLES_CHECKED
        ? { ...check, isComplete: false, changeRequired: null }
        : check,
    );
    release.rollbackNotes = "  ";

    expect(getReleaseBlockers(release).map((blocker) => blocker.code)).toEqual([
      "CHECK_INCOMPLETE",
      "CHANGE_REQUIREMENT_UNKNOWN",
      "ROLLBACK_PLAN_MISSING",
      "ITEM_NOT_READY",
    ]);
    expect(calculateReleaseReadiness(release).isReady).toBe(false);
  });

  it("requires a yes or no decision even after a change check is complete", () => {
    const release = readyRelease();
    release.checklistItems = release.checklistItems.map((check) =>
      check.kind === ChecklistKind.DATABASE_MIGRATION_CHECKED
        ? { ...check, changeRequired: null }
        : check,
    );

    expect(calculateReleaseReadiness(release).isReady).toBe(false);
    expect(getReleaseBlockers(release)).toContainEqual({
      code: "CHANGE_REQUIREMENT_UNKNOWN",
      message: "Database migration check has no change decision",
    });
  });

  it("allows an infrastructure release with no tickets", () => {
    const release = readyRelease();
    release.items = [];

    expect(calculateReleaseReadiness(release).isReady).toBe(true);
  });
});

describe("release status transitions", () => {
  const validContext = { isReady: true, deployedAt: new Date("2026-09-18") };

  it("allows the intended path and rollback after failure", () => {
    for (const [current, next] of [
      [ReleaseStatus.DRAFT, ReleaseStatus.IN_REVIEW],
      [ReleaseStatus.IN_REVIEW, ReleaseStatus.DRAFT],
      [ReleaseStatus.IN_REVIEW, ReleaseStatus.READY],
      [ReleaseStatus.READY, ReleaseStatus.IN_REVIEW],
      [ReleaseStatus.READY, ReleaseStatus.DEPLOYING],
      [ReleaseStatus.DEPLOYING, ReleaseStatus.DEPLOYED],
      [ReleaseStatus.DEPLOYING, ReleaseStatus.FAILED],
      [ReleaseStatus.FAILED, ReleaseStatus.ROLLED_BACK],
      [ReleaseStatus.DEPLOYED, ReleaseStatus.ROLLED_BACK],
    ]) {
      expect(canTransitionReleaseStatus(current, next, validContext)).toBe(true);
    }
  });

  it("rejects skipping statuses and changing a rolled-back release", () => {
    expect(
      canTransitionReleaseStatus(
        ReleaseStatus.DRAFT,
        ReleaseStatus.DEPLOYED,
        validContext,
      ),
    ).toBe(false);
    expect(
      canTransitionReleaseStatus(
        ReleaseStatus.ROLLED_BACK,
        ReleaseStatus.READY,
        validContext,
      ),
    ).toBe(false);
  });

  it("requires readiness both before READY and before DEPLOYING", () => {
    const blocked = { ...validContext, isReady: false };

    expect(
      canTransitionReleaseStatus(
        ReleaseStatus.IN_REVIEW,
        ReleaseStatus.READY,
        blocked,
      ),
    ).toBe(false);
    expect(
      canTransitionReleaseStatus(
        ReleaseStatus.READY,
        ReleaseStatus.DEPLOYING,
        blocked,
      ),
    ).toBe(false);
  });

  it("requires a deployment timestamp before DEPLOYED", () => {
    expect(
      canTransitionReleaseStatus(
        ReleaseStatus.DEPLOYING,
        ReleaseStatus.DEPLOYED,
        { ...validContext, deployedAt: null },
      ),
    ).toBe(false);
  });

  it("lists only intentional next statuses", () => {
    expect(getNextReleaseStatuses(ReleaseStatus.IN_REVIEW)).toEqual([
      ReleaseStatus.DRAFT,
      ReleaseStatus.READY,
    ]);
    expect(getNextReleaseStatuses(ReleaseStatus.ROLLED_BACK)).toEqual([]);
  });

  it("explains blocked moves", () => {
    expect(getTransitionError(
      ReleaseStatus.IN_REVIEW,
      ReleaseStatus.READY,
      { isReady: false, deployedAt: null },
    )).toMatch(/readiness blockers/);
    expect(getTransitionError(
      ReleaseStatus.DRAFT,
      ReleaseStatus.DEPLOYED,
      validContext,
    )).toMatch(/not allowed/);
  });
});
