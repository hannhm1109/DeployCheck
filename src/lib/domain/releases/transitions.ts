import { ReleaseStatus } from "../../../generated/prisma/enums";

const NEXT_STATUSES: Record<ReleaseStatus, readonly ReleaseStatus[]> = {
  DRAFT: [ReleaseStatus.IN_REVIEW],
  IN_REVIEW: [ReleaseStatus.DRAFT, ReleaseStatus.READY],
  READY: [ReleaseStatus.IN_REVIEW, ReleaseStatus.DEPLOYING],
  DEPLOYING: [ReleaseStatus.DEPLOYED, ReleaseStatus.FAILED],
  DEPLOYED: [ReleaseStatus.ROLLED_BACK],
  FAILED: [ReleaseStatus.ROLLED_BACK],
  ROLLED_BACK: [],
};

export type TransitionContext = {
  isReady: boolean;
  deployedAt: Date | null;
};

export function getNextReleaseStatuses(current: ReleaseStatus): readonly ReleaseStatus[] {
  return NEXT_STATUSES[current];
}

export function getTransitionError(
  current: ReleaseStatus,
  next: ReleaseStatus,
  context: TransitionContext,
): string | null {
  if (!NEXT_STATUSES[current].includes(next)) {
    return "That status change is not allowed from the current state.";
  }

  if (
    (next === ReleaseStatus.READY || next === ReleaseStatus.DEPLOYING) &&
    !context.isReady
  ) {
    return "Resolve all readiness blockers before this transition.";
  }

  if (next === ReleaseStatus.DEPLOYED && !context.deployedAt) {
    return "A deployment timestamp is required before marking a release deployed.";
  }

  return null;
}

export function canTransitionReleaseStatus(
  current: ReleaseStatus,
  next: ReleaseStatus,
  context: TransitionContext,
): boolean {
  return getTransitionError(current, next, context) === null;
}
